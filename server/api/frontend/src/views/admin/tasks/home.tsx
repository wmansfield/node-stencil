import { useState } from 'react';
import Card from '@/components/ui/Card';
import classNames from '@/utils/classNames';
import { TbRun } from 'react-icons/tb';
import { Button, Input } from '@/components/ui';

import Loading from '@/components/shared/Loading';
import {
   useTriggerIndexSyncMutation,
   useTriggerSynchronizationMutation,
   useTriggerImageResizeMutation,
   useTriggerRoleSyncMutation,
   useTriggerInvalidateEverythingMutation,
} from '@/stencil/endpoints/features/admin/taskApi';
import StencilUtils from '@/utils/StencilUtils';

type Task = {
   name: string;
   description: string;
   running: boolean;
   field?: string;
   action: (value?: string) => Promise<any>;
};

function TaskHome() {
   const [indexSync] = useTriggerIndexSyncMutation();
   const [entitySync] = useTriggerSynchronizationMutation();
   const [imageResize] = useTriggerImageResizeMutation();
   const [roleSync] = useTriggerRoleSyncMutation();
   const [invalidateEverything] = useTriggerInvalidateEverythingMutation();

   const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

   const executeTask = async (task: Task) => {
      try {
         setTasks(prev => prev.map(t => (t.name === task.name ? { ...t, running: true } : t)));
         const value = task.field ? fieldValues[task.name] : undefined;
         await task.action(value);
      } finally {
         setTasks(prev => prev.map(t => (t.name === task.name ? { ...t, running: false } : t)));
      }
   };

   const [tasks, setTasks] = useState<Task[]>([
      {
         name: 'System: Ensure Indexes',
         description: 'Ensures all indexes are created for all tenants',
         action: () => indexSync().unwrap(),
         running: false,
      },
      {
         name: 'System: Entity Synchronization',
         description: 'Manually trigger synchronization pass',
         action: () => entitySync().unwrap(),
         running: false,
      },
      {
         name: 'System: Dirty Everything',
         description: 'Manually dirty everything',
         action: () => invalidateEverything().unwrap(),
         running: false,
      },
      {
         name: 'System: Image Resize',
         description: 'Process pending image resize tasks',
         action: () => imageResize().unwrap(),
         running: false,
      },
      {
         name: 'System: Admin Role Sync',
         description: 'Hydrate admin role with all defined permissions',
         action: () => roleSync().unwrap(),
         running: false,
      },
   ]);

   return (
      <Card className="admin-card">
         <div className="flex items-center justify-between">
            <h4>Admin Tasks</h4>
         </div>
         <div className="mt-4">
            {tasks.map((task, index) => (
               <div
                  key={task.name}
                  className={classNames(
                     'flex items-center justify-between py-4 border-gray-200 dark:border-gray-600',
                     !StencilUtils.isLastChild(tasks, index) && 'border-b'
                  )}
               >
                  <div className="flex flex-row items-center gap-4">
                     <Button
                        variant="default"
                        color="primary"
                        disabled={task.running}
                        size="md"
                        icon={task.running ? <Loading type="inline" loading={true} /> : <TbRun className="text-xl" />}
                        onClick={() => executeTask(task)}
                     >
                        Execute
                     </Button>
                     <div>
                        <div className="heading-text font-bold mb-1">{task.name}</div>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1">{task.description}</div>
                        </div>
                        {task.field && (
                           <Input
                              id={`task_${index}`}
                              placeholder={task.field}
                              value={fieldValues[task.name] ?? ''}
                              onChange={(e) => setFieldValues(prev => ({ ...prev, [task.name]: e.target.value }))}
                           />
                        )}
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </Card>
   );
}

export default TaskHome;
