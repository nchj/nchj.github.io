14:15:21.842: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -- py_fx3/kpyfx3/fx3handler.py
14:15:27.258: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -B wip/add-fx3-controller origin/wip/add-fx3-controller --
Reset branch 'wip/add-fx3-controller'
M	SlaveFifoSyncMulti32/streamio.cydsn/cyfxgpif2config.h
A	py_fx3/kpyfx3/fx3handler.py
branch 'wip/add-fx3-controller' set up to track 'origin/wip/add-fx3-controller'.
Your branch is up to date with 'origin/wip/add-fx3-controller'.
14:15:37.755: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -B wip/add-fx3-controller origin/wip/add-fx3-controller --
Reset branch 'wip/add-fx3-controller'
M	SlaveFifoSyncMulti32/streamio.cydsn/cyfxgpif2config.h
A	py_fx3/kpyfx3/fx3handler.py
branch 'wip/add-fx3-controller' set up to track 'origin/wip/add-fx3-controller'.
Your branch is up to date with 'origin/wip/add-fx3-controller'.
14:18:30.795: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -- py_fx3/kpyfx3/fx3_controller.py
14:18:30.824: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false rm --ignore-unmatch --cached -r -- py_fx3/kpyfx3/fx3handler.py
14:21:29.271: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout master --
Switched to branch 'master'
M	SlaveFifoSyncMulti32/streamio.cydsn/cyfxgpif2config.h
A	py_fx3/kpyfx3/fx3_controller.py
Your branch is up to date with 'origin/master'.
14:21:32.551: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -d wip/add-fx3-controller
warning: deleting branch 'wip/add-fx3-controller' that has been merged to
         'refs/remotes/origin/wip/add-fx3-controller', but not yet merged to HEAD
Deleted branch wip/add-fx3-controller (was 64b84f4).
14:21:42.370: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin --recurse-submodules=no --progress --prune
remote: Enumerating objects: 6, done.        
remote: Counting objects:  16% (1/6)        
remote: Counting objects:  33% (2/6)        
remote: Counting objects:  50% (3/6)        
remote: Counting objects:  66% (4/6)        
remote: Counting objects:  83% (5/6)        
remote: Counting objects: 100% (6/6)        
remote: Counting objects: 100% (6/6), done.        
remote: Compressing objects:  20% (1/5)        
remote: Compressing objects:  40% (2/5)        
remote: Compressing objects:  60% (3/5)        
remote: Compressing objects:  80% (4/5)        
remote: Compressing objects: 100% (5/5)        
remote: Compressing objects: 100% (5/5), done.        
remote: Total 6 (delta 1), reused 1 (delta 1), pack-reused 0        
From github.com:Kolmostar/kasic_fx3
   4094015..67c61bb  master     -> origin/master
14:21:57.668: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false push --progress --porcelain origin :wip/hangjia-asyncio
To github.com:Kolmostar/kasic_fx3.git
-	:refs/heads/wip/hangjia-asyncio	[deleted]
Done
14:22:15.188: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin --recurse-submodules=no --progress --prune
14:22:19.732: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false restore --staged --worktree --source=HEAD -- py_fx3/kpyfx3/fx3_controller.py SlaveFifoSyncMulti32/streamio.cydsn/cyfxgpif2config.h
14:22:19.869: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false merge origin/master --no-stat -v
14:22:25.668: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -- py_fx3/kpyfx3/fx3_controller.py
14:28:47.755: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -d master
Deleted branch master (was 67c61bb).
14:28:52.548: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -b master origin/master --
Switched to a new branch 'master'
A	py_fx3/kpyfx3/fx3_controller.py
branch 'master' set up to track 'origin/master'.
14:28:58.256: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -d PR-fix-test
error: the branch 'PR-fix-test' is not fully merged.
If you are sure you want to delete it, run 'git branch -D PR-fix-test'
14:28:58.269: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -D PR-fix-test
Deleted branch PR-fix-test (was 5274a3a).
14:29:03.266: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -b PR-fix-test origin/PR-fix-test --
Switched to a new branch 'PR-fix-test'
A	py_fx3/kpyfx3/fx3_controller.py
branch 'PR-fix-test' set up to track 'origin/PR-fix-test'.
14:30:28.469: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout master --
Switched to branch 'master'
A	py_fx3/kpyfx3/fx3_controller.py
Your branch is up to date with 'origin/master'.
14:30:37.689: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -d PR-fix-test
warning: deleting branch 'PR-fix-test' that has been merged to
         'refs/remotes/origin/PR-fix-test', but not yet merged to HEAD
Deleted branch PR-fix-test (was 7bae24a).
14:32:13.422: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin --recurse-submodules=no --progress --prune
From github.com:Kolmostar/kasic_fx3
 - [deleted]         (none)     -> origin/PR-fix-test
remote: Enumerating objects: 6, done.        
remote: Counting objects:  16% (1/6)        
remote: Counting objects:  33% (2/6)        
remote: Counting objects:  50% (3/6)        
remote: Counting objects:  66% (4/6)        
remote: Counting objects:  83% (5/6)        
remote: Counting objects: 100% (6/6)        
remote: Counting objects: 100% (6/6), done.        
remote: Compressing objects:  16% (1/6)        
remote: Compressing objects:  33% (2/6)        
remote: Compressing objects:  50% (3/6)        
remote: Compressing objects:  66% (4/6)        
remote: Compressing objects:  83% (5/6)        
remote: Compressing objects: 100% (6/6)        
remote: Compressing objects: 100% (6/6), done.        
remote: Total 6 (delta 2), reused 0 (delta 0), pack-reused 0        
   67c61bb..15b6dea  master     -> origin/master
14:32:18.782: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false restore --staged --worktree --source=HEAD -- py_fx3/kpyfx3/fx3_controller.py
14:32:18.906: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false merge origin/master --no-stat -v
14:32:19.220: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -- py_fx3/kpyfx3/fx3_controller.py
14:42:29.304: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false push --progress --porcelain origin :wip/add-fx3-controller
To github.com:Kolmostar/kasic_fx3.git
-	:refs/heads/wip/add-fx3-controller	[deleted]
Done
14:42:52.772: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -b wip/refine master^0 --
Switched to a new branch 'wip/refine'
A	py_fx3/kpyfx3/fx3_controller.py
16:43:33.909: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false rm --ignore-unmatch --cached -r -- py_fx3/tests/unittest
17:14:39.375: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -b fix-doc master^0 --
Switched to a new branch 'fix-doc'
A	py_fx3/kpyfx3/fx3_controller.py
M	py_fx3/kpyfx3/fx3ctrl.py
M	py_fx3/tests/util.py
17:15:12.075: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false reset -- py_fx3/kpyfx3/fx3_controller.py
17:15:12.091: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/kpyfx3/fx3ctrl.py
17:15:12.108: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-.txt --
[fix-doc cb6884b] refine FX3AsyncIO read doc
 1 file changed, 23 insertions(+), 7 deletions(-)
17:15:12.242: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/kpyfx3/fx3_controller.py
17:39:58.636: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false reset -- py_fx3/kpyfx3/fx3_controller.py
17:39:58.653: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/kpyfx3/cli.py py_fx3/kpyfx3/usbhost.py py_fx3/kpyfx3/usbasyncio.py py_fx3/kpyfx3/fx3ctrl.py
17:39:58.672: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-.txt --
[fix-doc 122e837] refine model organization
 4 files changed, 47 insertions(+), 47 deletions(-)
17:39:58.838: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/kpyfx3/fx3_controller.py
17:40:14.383: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit --amend -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-.txt --only --no-verify
17:40:30.051: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin master:master --recurse-submodules=no --progress --prune
remote: Enumerating objects: 12, done.        
remote: Counting objects:   8% (1/12)        
remote: Counting objects:  16% (2/12)        
remote: Counting objects:  25% (3/12)        
remote: Counting objects:  33% (4/12)        
remote: Counting objects:  41% (5/12)        
remote: Counting objects:  50% (6/12)        
remote: Counting objects:  58% (7/12)        
remote: Counting objects:  66% (8/12)        
remote: Counting objects:  75% (9/12)        
remote: Counting objects:  83% (10/12)        
remote: Counting objects:  91% (11/12)        
remote: Counting objects: 100% (12/12)        
remote: Counting objects: 100% (12/12), done.        
remote: Compressing objects:  10% (1/10)        
remote: Compressing objects:  20% (2/10)        
remote: Compressing objects:  30% (3/10)        
remote: Compressing objects:  40% (4/10)        
remote: Compressing objects:  50% (5/10)        
remote: Compressing objects:  60% (6/10)        
remote: Compressing objects:  70% (7/10)        
remote: Compressing objects:  80% (8/10)        
remote: Compressing objects:  90% (9/10)        
remote: Compressing objects: 100% (10/10)        
remote: Compressing objects: 100% (10/10), done.        
remote: Total 12 (delta 2), reused 10 (delta 2), pack-reused 0        
From github.com:Kolmostar/kasic_fx3
   15b6dea..648fd82  master     -> master
   15b6dea..648fd82  master     -> origin/master
17:41:55.163: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -b PR-fix-fx3asyncio origin/PR-fix-fx3asyncio --
Switched to a new branch 'PR-fix-fx3asyncio'
branch 'PR-fix-fx3asyncio' set up to track 'origin/PR-fix-fx3asyncio'.
17:43:25.955: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false cherry-pick 1c2fe2c96cd8ba00aacc59d0cab1eebbccedd1f7
Auto-merging py_fx3/kpyfx3/fx3ctrl.py
Auto-merging py_fx3/kpyfx3/usbasyncio.py
CONFLICT (content): Merge conflict in py_fx3/kpyfx3/usbasyncio.py
Auto-merging py_fx3/kpyfx3/usbhost.py
CONFLICT (content): Merge conflict in py_fx3/kpyfx3/usbhost.py
error: could not apply 1c2fe2c... refine module organization
hint: After resolving the conflicts, mark them with
hint: "git add/rm <pathspec>", then run
hint: "git cherry-pick --continue".
hint: You can instead skip this commit with "git cherry-pick --skip".
hint: To abort and get back to the state before "git cherry-pick",
hint: run "git cherry-pick --abort".
17:43:50.644: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f --sparse -- py_fx3/kpyfx3/usbhost.py
17:45:08.776: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f --sparse -- py_fx3/kpyfx3/usbasyncio.py
17:45:16.059: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/kpyfx3/cli.py py_fx3/kpyfx3/usbhost.py py_fx3/kpyfx3/usbasyncio.py py_fx3/kpyfx3/fx3ctrl.py
17:45:16.079: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-1.txt --date "2024-01-22 17:39:58" --
[PR-fix-fx3asyncio e267c7e] refine module organization
 Date: Mon Jan 22 17:39:58 2024 +0800
 4 files changed, 9 insertions(+), 6 deletions(-)
17:47:05.158: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/kpyfx3/usbasyncio.py
17:47:05.172: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-1.txt --amend --
[PR-fix-fx3asyncio a3bcb60] refine module organization
 Date: Mon Jan 22 17:39:58 2024 +0800
 4 files changed, 8 insertions(+), 6 deletions(-)
17:47:28.464: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false cherry-pick cb6884bc85dc2a107097e5f326ea0dd24a50a0e6
Auto-merging py_fx3/kpyfx3/fx3ctrl.py
[PR-fix-fx3asyncio f8e2707] refine FX3AsyncIO read doc
 Date: Mon Jan 22 17:15:12 2024 +0800
 1 file changed, 23 insertions(+), 7 deletions(-)
17:48:03.337: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false push --progress --porcelain origin refs/heads/PR-fix-fx3asyncio:PR-fix-fx3asyncio
Enumerating objects: 20, done.
Counting objects:   5% (1/20)
Counting objects:  10% (2/20)
Counting objects:  15% (3/20)
Counting objects:  20% (4/20)
Counting objects:  25% (5/20)
Counting objects:  30% (6/20)
Counting objects:  35% (7/20)
Counting objects:  40% (8/20)
Counting objects:  45% (9/20)
Counting objects:  50% (10/20)
Counting objects:  55% (11/20)
Counting objects:  60% (12/20)
Counting objects:  65% (13/20)
Counting objects:  70% (14/20)
Counting objects:  75% (15/20)
Counting objects:  80% (16/20)
Counting objects:  85% (17/20)
Counting objects:  90% (18/20)
Counting objects:  95% (19/20)
Counting objects: 100% (20/20)
Counting objects: 100% (20/20), done.
Delta compression using up to 12 threads
Compressing objects:   7% (1/13)
Compressing objects:  15% (2/13)
Compressing objects:  23% (3/13)
Compressing objects:  30% (4/13)
Compressing objects:  38% (5/13)
Compressing objects:  46% (6/13)
Compressing objects:  53% (7/13)
Compressing objects:  61% (8/13)
Compressing objects:  69% (9/13)
Compressing objects:  76% (10/13)
Compressing objects:  84% (11/13)
Compressing objects:  92% (12/13)
Compressing objects: 100% (13/13)
Compressing objects: 100% (13/13), done.
Writing objects:   7% (1/13)
Writing objects:  15% (2/13)
Writing objects:  23% (3/13)
Writing objects:  30% (4/13)
Writing objects:  38% (5/13)
Writing objects:  46% (6/13)
Writing objects:  53% (7/13)
Writing objects:  61% (8/13)
Writing objects:  69% (9/13)
Writing objects:  76% (10/13)
Writing objects:  84% (11/13)
Writing objects:  92% (12/13)
Writing objects: 100% (13/13)
Writing objects: 100% (13/13), 1.58 KiB | 1.58 MiB/s, done.
Total 13 (delta 11), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas:   0% (0/11)        
remote: Resolving deltas:   9% (1/11)        
remote: Resolving deltas:  18% (2/11)        
remote: Resolving deltas:  27% (3/11)        
remote: Resolving deltas:  36% (4/11)        
remote: Resolving deltas:  45% (5/11)        
remote: Resolving deltas:  54% (6/11)        
remote: Resolving deltas:  63% (7/11)        
remote: Resolving deltas:  72% (8/11)        
remote: Resolving deltas:  81% (9/11)        
remote: Resolving deltas:  90% (10/11)        
remote: Resolving deltas: 100% (11/11)        
remote: Resolving deltas: 100% (11/11), completed with 7 local objects.        
To github.com:Kolmostar/kasic_fx3.git
 	refs/heads/PR-fix-fx3asyncio:refs/heads/PR-fix-fx3asyncio	344f49b..f8e2707
Done
18:10:11.885: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/kpyfx3/usbasyncio.py
18:10:11.902: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-1.txt --
[PR-fix-fx3asyncio 701d914] fix missing import
 1 file changed, 1 insertion(+)
18:10:19.576: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false push --progress --porcelain origin refs/heads/PR-fix-fx3asyncio:PR-fix-fx3asyncio
Enumerating objects: 9, done.
Counting objects:  11% (1/9)
Counting objects:  22% (2/9)
Counting objects:  33% (3/9)
Counting objects:  44% (4/9)
Counting objects:  55% (5/9)
Counting objects:  66% (6/9)
Counting objects:  77% (7/9)
Counting objects:  88% (8/9)
Counting objects: 100% (9/9)
Counting objects: 100% (9/9), done.
Delta compression using up to 12 threads
Compressing objects:  20% (1/5)
Compressing objects:  40% (2/5)
Compressing objects:  60% (3/5)
Compressing objects:  80% (4/5)
Compressing objects: 100% (5/5)
Compressing objects: 100% (5/5), done.
Writing objects:  20% (1/5)
Writing objects:  40% (2/5)
Writing objects:  60% (3/5)
Writing objects:  80% (4/5)
Writing objects: 100% (5/5)
Writing objects: 100% (5/5), 428 bytes | 428.00 KiB/s, done.
Total 5 (delta 4), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas:   0% (0/4)        
remote: Resolving deltas:  25% (1/4)        
remote: Resolving deltas:  50% (2/4)        
remote: Resolving deltas:  75% (3/4)        
remote: Resolving deltas: 100% (4/4)        
remote: Resolving deltas: 100% (4/4), completed with 4 local objects.        
To github.com:Kolmostar/kasic_fx3.git
 	refs/heads/PR-fix-fx3asyncio:refs/heads/PR-fix-fx3asyncio	f8e2707..701d914
Done
09:47:53.752: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin --recurse-submodules=no --progress --prune
From github.com:Kolmostar/kasic_fx3
 - [deleted]         (none)            -> origin/PR-streamio-state-machine-with-commit
remote: Enumerating objects: 5, done.        
remote: Counting objects:  20% (1/5)        
remote: Counting objects:  40% (2/5)        
remote: Counting objects:  60% (3/5)        
remote: Counting objects:  80% (4/5)        
remote: Counting objects: 100% (5/5)        
remote: Counting objects: 100% (5/5), done.        
remote: Total 5 (delta 4), reused 5 (delta 4), pack-reused 0        
   701d914..7f73c05  PR-fix-fx3asyncio -> origin/PR-fix-fx3asyncio
09:47:59.979: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false merge origin/PR-fix-fx3asyncio --no-stat -v
16:33:05.852: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout HEAD -- py_fx3/demos/kasic-loopback.py
16:33:23.589: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout HEAD -- py_fx3/kpyfx3/usbasyncio.py
16:33:29.907: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout HEAD -- py_fx3/kpyfx3/usbhost.py
17:07:52.093: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout wip/refine --
Switched to branch 'wip/refine'
17:12:38.790: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout PR-fix-fx3asyncio --
Switched to branch 'PR-fix-fx3asyncio'
M	py_fx3/tests/util.py
Your branch is up to date with 'origin/PR-fix-fx3asyncio'.
09:27:38.212: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin master:master --recurse-submodules=no --progress --prune
remote: Enumerating objects: 18, done.        
remote: Counting objects:   5% (1/18)        
remote: Counting objects:  11% (2/18)        
remote: Counting objects:  16% (3/18)        
remote: Counting objects:  22% (4/18)        
remote: Counting objects:  27% (5/18)        
remote: Counting objects:  33% (6/18)        
remote: Counting objects:  38% (7/18)        
remote: Counting objects:  44% (8/18)        
remote: Counting objects:  50% (9/18)        
remote: Counting objects:  55% (10/18)        
remote: Counting objects:  61% (11/18)        
remote: Counting objects:  66% (12/18)        
remote: Counting objects:  72% (13/18)        
remote: Counting objects:  77% (14/18)        
remote: Counting objects:  83% (15/18)        
remote: Counting objects:  88% (16/18)        
remote: Counting objects:  94% (17/18)        
remote: Counting objects: 100% (18/18)        
remote: Counting objects: 100% (18/18), done.        
remote: Compressing objects:  16% (1/6)        
remote: Compressing objects:  33% (2/6)        
remote: Compressing objects:  50% (3/6)        
remote: Compressing objects:  66% (4/6)        
remote: Compressing objects:  83% (5/6)        
remote: Compressing objects: 100% (6/6)        
remote: Compressing objects: 100% (6/6), done.        
remote: Total 10 (delta 8), reused 4 (delta 4), pack-reused 0        
From github.com:Kolmostar/kasic_fx3
   648fd82..cd8a580  master     -> master
   648fd82..cd8a580  master     -> origin/master
09:29:37.413: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout master --
Switched to branch 'master'
M	py_fx3/tests/util.py
Your branch is up to date with 'origin/master'.
09:29:44.361: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -d PR-fix-fx3asyncio
Deleted branch PR-fix-fx3asyncio (was 7f73c05).
09:29:51.224: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -d fix-doc
error: the branch 'fix-doc' is not fully merged.
If you are sure you want to delete it, run 'git branch -D fix-doc'
09:29:51.238: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -D fix-doc
Deleted branch fix-doc (was 1c2fe2c).
09:29:56.208: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin --recurse-submodules=no --progress --prune
From github.com:Kolmostar/kasic_fx3
 - [deleted]         (none)                -> origin/PR-fix-fx3asyncio
 - [deleted]         (none)                -> origin/PR-fx3-asyncio-client
remote: Enumerating objects: 6, done.        
remote: Counting objects:  16% (1/6)        
remote: Counting objects:  33% (2/6)        
remote: Counting objects:  50% (3/6)        
remote: Counting objects:  66% (4/6)        
remote: Counting objects:  83% (5/6)        
remote: Counting objects: 100% (6/6)        
remote: Counting objects: 100% (6/6), done.        
remote: Compressing objects:  50% (1/2)        
remote: Compressing objects: 100% (2/2)        
remote: Compressing objects: 100% (2/2), done.        
remote: Total 6 (delta 4), reused 6 (delta 4), pack-reused 0        
 * [new branch]      PR-fix-usb-descriptor -> origin/PR-fix-usb-descriptor
09:36:28.150: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -b wip/add-readonly-mode master^0 --
Switched to a new branch 'wip/add-readonly-mode'
M	py_fx3/tests/util.py
09:37:35.032: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout master --
Switched to branch 'master'
Your branch is up to date with 'origin/master'.
09:37:44.609: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -b wip/add-unittest master^0 --
Switched to a new branch 'wip/add-unittest'
09:37:59.601: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -- py_fx3/tests/test_fx3ctrl.py
09:38:04.247: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -- py_fx3/tests/test_fx3ctrl.py
09:38:19.741: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/tests/test_fx3ctrl.py
09:38:19.754: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-1.txt --
[wip/add-unittest 79f1fe8] add FX3AsyncIOTest
 1 file changed, 76 insertions(+)
 create mode 100644 py_fx3/tests/test_fx3ctrl.py
09:38:26.487: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout wip/add-readonly-mode --
Switched to branch 'wip/add-readonly-mode'
09:39:37.426: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout -b wip/impl-doc master^0 --
Switched to a new branch 'wip/impl-doc'
09:39:43.445: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false branch -d wip/refine
Deleted branch wip/refine (was 15b6dea).
09:40:17.289: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -- py_fx3/doc/class_diag.drawio.svg py_fx3/doc/Kpyfx3_impl_doc.md py_fx3/doc/class.puml
09:40:17.316: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -- py_fx3/doc
09:40:28.134: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/doc/class_diag.drawio.svg py_fx3/doc/Kpyfx3_impl_doc.md py_fx3/doc/class.puml
09:40:28.145: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-1.txt --
[wip/impl-doc 079b48d] temp doc
 3 files changed, 107 insertions(+)
 create mode 100644 py_fx3/doc/Kpyfx3_impl_doc.md
 create mode 100644 py_fx3/doc/class.puml
 create mode 100644 py_fx3/doc/class_diag.drawio.svg
09:40:32.919: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout wip/add-readonly-mode --
Switched to branch 'wip/add-readonly-mode'
14:25:57.532: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/tests/functional_test/test_loop_back.py py_fx3/kpyfx3/cli.py py_fx3/tests/util.py py_fx3/tests/functional_test/test_rf_data.py py_fx3/demos/kasic-loopback.py py_fx3/kpyfx3/fx3ctrl.py
14:25:57.563: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-1.txt --
[wip/add-readonly-mode 27fffbe] add STREAM_IN_ONLY_MODE mode in kpyfx3
 6 files changed, 11 insertions(+), 10 deletions(-)
14:26:12.885: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit --amend -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-1.txt --only --no-verify
14:29:55.495: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/demos/kasic-loopback.py
14:29:55.508: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-2.txt --amend --
[wip/add-readonly-mode 7d087b3] add STREAM_IN_ONLY_MODE in kpyfx3
 Date: Wed Jan 24 14:25:57 2024 +0800
 5 files changed, 10 insertions(+), 10 deletions(-)
14:30:41.461: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/tests/functional_test/test_loop_back.py
14:30:41.474: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-2.txt --amend --
[wip/add-readonly-mode 88acc36] add STREAM_IN_ONLY_MODE in kpyfx3
 Date: Wed Jan 24 14:25:57 2024 +0800
 4 files changed, 9 insertions(+), 9 deletions(-)
14:36:22.872: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false push --progress --porcelain origin refs/heads/wip/add-readonly-mode:refs/heads/wip/add-readonly-mode --set-upstream
Enumerating objects: 31, done.
Counting objects:   3% (1/31)
Counting objects:   6% (2/31)
Counting objects:   9% (3/31)
Counting objects:  12% (4/31)
Counting objects:  16% (5/31)
Counting objects:  19% (6/31)
Counting objects:  22% (7/31)
Counting objects:  25% (8/31)
Counting objects:  29% (9/31)
Counting objects:  32% (10/31)
Counting objects:  35% (11/31)
Counting objects:  38% (12/31)
Counting objects:  41% (13/31)
Counting objects:  45% (14/31)
Counting objects:  48% (15/31)
Counting objects:  51% (16/31)
Counting objects:  54% (17/31)
Counting objects:  58% (18/31)
Counting objects:  61% (19/31)
Counting objects:  64% (20/31)
Counting objects:  67% (21/31)
Counting objects:  70% (22/31)
Counting objects:  74% (23/31)
Counting objects:  77% (24/31)
Counting objects:  80% (25/31)
Counting objects:  83% (26/31)
Counting objects:  87% (27/31)
Counting objects:  90% (28/31)
Counting objects:  93% (29/31)
Counting objects:  96% (30/31)
Counting objects: 100% (31/31)
Counting objects: 100% (31/31), done.
Delta compression using up to 12 threads
Compressing objects:   5% (1/17)
Compressing objects:  11% (2/17)
Compressing objects:  17% (3/17)
Compressing objects:  23% (4/17)
Compressing objects:  29% (5/17)
Compressing objects:  35% (6/17)
Compressing objects:  41% (7/17)
Compressing objects:  47% (8/17)
Compressing objects:  52% (9/17)
Compressing objects:  58% (10/17)
Compressing objects:  64% (11/17)
Compressing objects:  70% (12/17)
Compressing objects:  76% (13/17)
Compressing objects:  82% (14/17)
Compressing objects:  88% (15/17)
Compressing objects:  94% (16/17)
Compressing objects: 100% (17/17)
Compressing objects: 100% (17/17), done.
Writing objects:   5% (1/17)
Writing objects:  11% (2/17)
Writing objects:  17% (3/17)
Writing objects:  23% (4/17)
Writing objects:  29% (5/17)
Writing objects:  35% (6/17)
Writing objects:  41% (7/17)
Writing objects:  47% (8/17)
Writing objects:  52% (9/17)
Writing objects:  58% (10/17)
Writing objects:  64% (11/17)
Writing objects:  70% (12/17)
Writing objects:  76% (13/17)
Writing objects:  82% (14/17)
Writing objects:  88% (15/17)
Writing objects:  94% (16/17)
Writing objects: 100% (17/17)
Writing objects: 100% (17/17), 2.31 KiB | 1.16 MiB/s, done.
Total 17 (delta 15), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas:   0% (0/15)        
remote: Resolving deltas:   6% (1/15)        
remote: Resolving deltas:  13% (2/15)        
remote: Resolving deltas:  20% (3/15)        
remote: Resolving deltas:  26% (4/15)        
remote: Resolving deltas:  33% (5/15)        
remote: Resolving deltas:  40% (6/15)        
remote: Resolving deltas:  46% (7/15)        
remote: Resolving deltas:  53% (8/15)        
remote: Resolving deltas:  60% (9/15)        
remote: Resolving deltas:  66% (10/15)        
remote: Resolving deltas:  73% (11/15)        
remote: Resolving deltas:  80% (12/15)        
remote: Resolving deltas:  86% (13/15)        
remote: Resolving deltas:  93% (14/15)        
remote: Resolving deltas: 100% (15/15)        
remote: Resolving deltas: 100% (15/15), completed with 14 local objects.        
remote: 
remote: Create a pull request for 'wip/add-readonly-mode' on GitHub by visiting:        
remote:      https://github.com/Kolmostar/kasic_fx3/pull/new/wip/add-readonly-mode        
remote: 
To github.com:Kolmostar/kasic_fx3.git
*	refs/heads/wip/add-readonly-mode:refs/heads/wip/add-readonly-mode	[new branch]
branch 'wip/add-readonly-mode' set up to track 'origin/wip/add-readonly-mode'.
Done
15:13:00.484: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false add --ignore-errors -A -f -- py_fx3/tests/functional_test/test_loop_back.py py_fx3/kpyfx3/cli.py py_fx3/demos/kasic-loopback.py py_fx3/kpyfx3/fx3ctrl.py
15:13:00.511: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false commit -F /private/var/folders/rv/zbc603m14gv762x_lp3cqz500000gn/T/git-commit-msg-2.txt --
[wip/add-readonly-mode 03be5cc] refine FX3Mode enum
 4 files changed, 9 insertions(+), 8 deletions(-)
11:05:35.976: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout HEAD -- SlaveFifoSyncMulti32/streamio.cydsn/cyfxgpif2config.h
14:50:44.507: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin PR-design-doc:PR-design-doc --recurse-submodules=no --progress --prune
From github.com:Kolmostar/kasic_fx3
   6c70b7e..d4ec055  PR-design-doc -> PR-design-doc
14:57:47.875: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false checkout wip/add-unittest --
Switched to branch 'wip/add-unittest'
16:09:50.175: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false fetch origin master:master --recurse-submodules=no --progress --prune
From github.com:Kolmostar/kasic_fx3
   cd8a580..37cdd39  master     -> master
16:10:29.424: [../../kasic_fx3] git -c credential.helper= -c core.quotepath=false -c log.showSignature=false -c core.commentChar= rebase master
Rebasing (1/1)
Successfully rebased and updated refs/heads/wip/add-unittest.
