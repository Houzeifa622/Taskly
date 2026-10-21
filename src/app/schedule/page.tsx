import ScheduleForm from "@/components/ScheduleForm";
import ScheduleList from "@/components/ScheduleList";

export default function SchedulePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Emploi du temps</h1>
      </div>

      <ScheduleForm />
      <ScheduleList />
    </div>
  );
}