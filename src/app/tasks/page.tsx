import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";

export default function TasksPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Mes tâches</h1>
      </div>

      <TaskForm />
      <TaskList />
    </div>
  );
}
