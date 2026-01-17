import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    DropAnimation,
    UniqueIdentifier,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface TaskRecord {
    id: number;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string | null;
    assignedTo?: number | null;
    createdAt: string;
    description?: string;
}

const COLUMNS = [
    { id: 'pending', title: 'Pending', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { id: 'completed', title: 'Completed', color: 'bg-green-50 border-green-200' },
];

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'critical': return 'text-red-700 bg-red-100';
        case 'high': return 'text-orange-700 bg-orange-100';
        case 'medium': return 'text-blue-700 bg-blue-100';
        case 'low': return 'text-gray-700 bg-gray-100';
        default: return 'text-gray-700 bg-gray-100';
    }
};

interface SortableTaskItemProps {
    task: TaskRecord;
    updateStatus: (id: number, status: string) => void;
}

function SortableTaskItem({ task, updateStatus }: SortableTaskItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-gray-100 border border-dashed border-gray-400 rounded-lg h-[100px]"
            />
        );
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="shadow-sm hover:shadow-md transition-shadow cursor-grab bg-white touch-none group"
            {...attributes}
            {...listeners}
        >
            <CardHeader className="p-3 pb-2 space-y-1">
                <div className="flex justify-between items-start">
                    <Badge className={cn("text-[10px] px-1.5 py-0", getPriorityColor(task.priority))}>
                        {task.priority}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 -mr-1">
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(task.id, 'pending')}>
                                Move to Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(task.id, 'in_progress')}>
                                Move to In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(task.id, 'completed')}>
                                Move to Completed
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                {task.dueDate && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DroppableColumn({ id, children }: { id: string, children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div ref={setNodeRef} className="h-full flex flex-col gap-3">
            {children}
        </div>
    );
}

export default function TaskBoard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

    const { data: tasks = [], isLoading } = useQuery<TaskRecord[]>({
        queryKey: ['/api/admin/tasks'],
        queryFn: () => authenticatedFetch('/api/admin/tasks'),
    });

    // ADMIN-TODO-003: Add task status transition rules, assignee notifications, and bulk updates.
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            return apiRequest(`/api/admin/tasks/${id}`, 'PUT', { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
            toast({ title: 'Task updated' });
        },
        onError: () => {
            toast({ title: 'Failed to update task', variant: 'destructive' });
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: async (title: string) => {
            return apiRequest('/api/admin/tasks', 'POST', {
                title,
                status: 'pending',
                priority: 'medium',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
            toast({ title: 'Task created' });
            setIsCreateOpen(false);
            setNewTaskTitle('');
        },
        onError: () => {
            toast({ title: 'Failed to create task', variant: 'destructive' });
        },
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        // This is purely for visual feedback during drag if we were managing local state for ordering
        // For status columns, actual move happens onDrop
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        const overId = over.id; // This could be a task ID or a column ID

        if (!activeTask) return;

        // Determine target status
        let targetStatus = '';

        // Check if dropped on a column
        if (COLUMNS.some(c => c.id === overId)) {
            targetStatus = overId as string;
        } else {
            // Dropped on another task, find that task's status
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                targetStatus = overTask.status;
            }
        }

        if (targetStatus && targetStatus !== activeTask.status) {
            updateStatusMutation.mutate({
                id: activeTask.id,
                status: targetStatus
            });
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    if (isLoading) {
        return <div className="p-4">Loading board...</div>;
    }

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-xl font-semibold">Task Board</h2>
                <Button onClick={() => setIsCreateOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex-1 overflow-x-auto">
                    <div className="flex gap-4 h-full min-w-[800px]">
                        {COLUMNS.map((col) => {
                            const colTasks = tasks.filter(t => t.status === col.id);
                            return (
                                <div key={col.id} className={cn("flex-1 min-w-[280px] rounded-lg p-3 flex flex-col gap-3", col.color)}>
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-semibold text-gray-700">{col.title}</h3>
                                        <Badge variant="secondary" className="bg-white/50">
                                            {colTasks.length}
                                        </Badge>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                        <SortableContext
                                            id={col.id}
                                            items={colTasks.map(t => t.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="h-full min-h-[100px]">
                                                {/* We need useDroppable for the column to be a target when empty */}
                                                <DroppableColumn id={col.id}>
                                                    {colTasks.map((task) => (
                                                        <SortableTaskItem
                                                            key={task.id}
                                                            task={task}
                                                            updateStatus={(id, s) => updateStatusMutation.mutate({ id, status: s })}
                                                        />
                                                    ))}
                                                    {colTasks.length === 0 && (
                                                        <div className="h-24 border-2 border-dashed border-gray-300/50 rounded-lg flex items-center justify-center text-gray-400">
                                                            <span className="text-xs">Drop items here</span>
                                                        </div>
                                                    )}
                                                </DroppableColumn>
                                            </div>
                                        </SortableContext>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <Card className="shadow-lg cursor-grabbing bg-white w-[280px] opacity-80 rotate-2">
                            <CardHeader className="p-3 pb-2 space-y-1">
                                <div className="flex justify-between items-start">
                                    <Badge className={cn("text-[10px] px-1.5 py-0", getPriorityColor(activeTask.priority))}>
                                        {activeTask.priority}
                                    </Badge>
                                </div>
                                <CardTitle className="text-sm font-medium leading-tight">{activeTask.title}</CardTitle>
                            </CardHeader>
                        </Card>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Task Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter task description..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createTaskMutation.mutate(newTaskTitle)} disabled={!newTaskTitle.trim()}>
                            Create Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
