hackthon
在黑客松中，严禁两个人同时直接在 main (或 master) 分支上修改代码，这绝对会导致地狱般的 Merge Conflict。

请严格遵守以下 4 步循环：

Step 1: 切出分支 (Branching)
每当你准备开发一个新功能（例如 "User Login" 或 "Data Visualization"）时，从最新的 main 切出一个新分支。

Bash

# 确保你的 main 是最新的
git checkout main
git pull origin main

# 创建并切换到新分支（命名要英文且明确）
git checkout -b feature/login-page
Step 2: 提交代码 (Committing)
在你的分支上通过 IDE（如 VS Code）写代码。

Bash

git add .
git commit -m "Add login form UI"
Step 3: 同步进度 (Syncing)
当你写完这个功能，或者想把代码给队友看时：

Bash

# 把你的分支推送到 GitHub
git push origin feature/login-page
Step 4: 合并 (Merging) - 黑客松特供版
这里有两种流派，为了防止翻车，我建议 Pull Request (PR) 流派，虽然多一步，但能救命。

你打开 GitHub 页面，会看到 Compare & pull request 的绿色按钮。

点击创建 Pull Request。

口头通知队友："我提交了 Login 模块，你 Review 一下或者直接合并。"

队友（或你自己，如果没有严重冲突）点击 GitHub 上的 Merge Pull Request 按钮。

回到终端，更新本地：

Bash

git checkout main
git pull origin main  # 把合并后的最新代码拉下来
Phase 3: 冲突解决 (Conflict Resolution)
如果你们不小心改了同一个文件的同一行（比如 config.js），GitHub 会提示 Conflict。

Traceback-First: 看 GitHub 或命令行的英文报错，找到冲突的文件路径。

在 VS Code 中打开该文件，你会看到：

Plaintext

<<<<<<< HEAD
你的代码
=======
队友的代码
>>>>>>> feature/his-branch
人工决策： 删除 <<<<, ====, >>>> 这些标记，保留正确的代码逻辑。

重新 git add -> git commit -> git push。

⚠️ Orthogonal Insight: 还没被提到的风险
作为技术专家，我必须指出，在黑客松中，比 Git Conflict 更可怕的是 Environment Discrepancy（环境不一致）。

"他那里能跑，我这里报错" 是最大的时间杀手。

Lock Dependencies: 既然他已经建好了文件，检查是否有 requirements.txt (Python) 或 package-lock.json (Node.js)。如果没有，立刻让他生成并上传。这比同步业务代码更重要。

Config Isolation: 所有的 API Key、Database URL 等敏感或环境特定的变量，必须放在 .env 文件中，并且将 .env 加入 .gitignore。不要把 API Key 硬编码在代码里上传，否则你们会在配置上打架。