import { createFileRoute, redirect } from "@tanstack/react-router";
import { EMPLOYEES, isEmployeeId } from "@/lib/employees";
import { createThread } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/app/$employee/")({
  beforeLoad: async ({ params }) => {
    if (!isEmployeeId(params.employee)) {
      throw redirect({ to: "/app/$employee", params: { employee: "lin" } });
    }
    const thread = await createThread({ data: { employee: params.employee } });
    throw redirect({
      to: "/app/$employee/$threadId",
      params: { employee: params.employee, threadId: thread.id },
    });
  },
});

export const employeeMeta = EMPLOYEES;
