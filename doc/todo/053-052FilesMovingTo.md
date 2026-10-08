# 052 files moving to archive fix

## Original Requirement

[NEVER REMOVE]

TODO 052 moves files to archive if bigger than github issue number BUT only move tasks that are DONE in the file name.

Also, fix the root cause: when agent creates new todo files in file system and at most cases also in Kanban board (bit sometimes also not in Kanban board) then ALSO create Github issue. When kanban board card is created manually from [todzz.eu](http://todzz.eu) web UI then Github issue is created. Maybe somehow same way can be created when agent creates. Ideal:

_From Kanban card `9d6361c8-1301-495b-811c-70a3c5f650ad`._
