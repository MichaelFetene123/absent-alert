"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, type StudentInput } from "@/lib/validations/student";
import { createStudent, updateStudent } from "@/actions/student.actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Save, Phone, School, User, Hash, Smartphone, Sparkles } from "lucide-react";

export type StudentItem = {
  id: string;
  admissionNo: string;
  fullName: string;
  classId: string;
  className: string;
  active: boolean;
  guardianName: string;
  guardianPhone: string;
};

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: Array<{ id: string; name: string }>;
  student?: StudentItem | null;
  onSuccess?: () => void;
}

export function StudentForm({
  open,
  onOpenChange,
  classes,
  student,
  onSuccess,
}: StudentFormProps) {
  const router = useRouter();
  const isEdit = !!student;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionNo: "",
      fullName: "",
      classId: classes[0]?.id || "",
      guardianName: "",
      guardianPhone: "",
      active: true,
    },
  });

  // Sync form values when opening for edit or create
  React.useEffect(() => {
    if (open) {
      if (student) {
        reset({
          admissionNo: student.admissionNo,
          fullName: student.fullName,
          classId: student.classId,
          guardianName: student.guardianName === "—" ? "" : student.guardianName,
          guardianPhone: student.guardianPhone.includes("*") ? "" : student.guardianPhone,
          active: student.active,
        });
      } else {
        reset({
          admissionNo: "",
          fullName: "",
          classId: classes[0]?.id || "",
          guardianName: "",
          guardianPhone: "",
          active: true,
        });
      }
    }
  }, [open, student, classes, reset]);

  async function onSubmit(data: StudentInput) {
    try {
      if (isEdit && student) {
        const res = await updateStudent({
          id: student.id,
          admissionNo: data.admissionNo,
          fullName: data.fullName,
          classId: data.classId,
          guardianName: data.guardianName,
          guardianPhone: data.guardianPhone,
        });

        if (!res.ok) {
          toast.error(res.error || "Failed to update student");
          return;
        }

        toast.success(`Student ${data.fullName} updated successfully`);
      } else {
        const res = await createStudent(data);
        if (!res.ok) {
          toast.error(res.error || "Failed to create student");
          return;
        }

        toast.success(`Student ${data.fullName} registered successfully`);
      }

      onOpenChange(false);
      reset();
      router.refresh();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto rounded-l-3xl border-slate-200 dark:border-slate-800 p-6">
        <SheetHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {isEdit ? <Save className="size-5" /> : <UserPlus className="size-5" />}
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white">
                {isEdit ? "Edit Student Profile" : "Register New Student"}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? "Update academic records and guardian mobile details"
                  : "Add student to active classroom roster with guardian mobile alert phone"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* Admission Number */}
          <div className="space-y-1.5">
            <Label htmlFor="admissionNo" className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Hash className="size-3.5 text-slate-400" />
              Admission Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admissionNo"
              placeholder="e.g. ADM-008"
              {...register("admissionNo")}
              className={`h-10 rounded-xl font-mono text-sm ${errors.admissionNo ? "border-red-500" : ""}`}
            />
            {errors.admissionNo && (
              <p className="text-xs text-red-600">{errors.admissionNo.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="size-3.5 text-slate-400" />
              Student Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="e.g. Almaz Kebede"
              {...register("fullName")}
              className={`h-10 rounded-xl font-semibold ${errors.fullName ? "border-red-500" : ""}`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Class Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="classId" className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <School className="size-3.5 text-slate-400" />
              Assigned Classroom <span className="text-red-500">*</span>
            </Label>
            <select
              id="classId"
              {...register("classId")}
              className="w-full h-10 px-3 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes.length === 0 ? (
                <option value="">No classrooms available</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id} className="dark:bg-slate-900">
                    {cls.name}
                  </option>
                ))
              )}
            </select>
            {errors.classId && (
              <p className="text-xs text-red-600">{errors.classId.message}</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-purple-500/10 text-purple-600">
                <Smartphone className="size-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Primary Guardian &amp; SMS Destination
              </h4>
            </div>

            {/* Guardian Name */}
            <div className="space-y-1.5">
              <Label htmlFor="guardianName" className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="size-3.5 text-slate-400" />
                Guardian Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guardianName"
                placeholder="e.g. Kebede Tessema"
                {...register("guardianName")}
                className={`h-10 rounded-xl font-semibold ${errors.guardianName ? "border-red-500" : ""}`}
              />
              {errors.guardianName && (
                <p className="text-xs text-red-600">{errors.guardianName.message}</p>
              )}
            </div>

            {/* Guardian Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="guardianPhone" className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Phone className="size-3.5 text-slate-400" />
                Guardian Mobile Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guardianPhone"
                type="tel"
                placeholder="0911223344 or +251911223344"
                {...register("guardianPhone")}
                className={`h-10 rounded-xl font-mono text-sm ${errors.guardianPhone ? "border-red-500" : ""}`}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Ethiopian mobile number. System automatically sanitizes and normalizes to E.164 (+251...) format for SMSHub.
              </p>
              {errors.guardianPhone && (
                <p className="text-xs text-red-600">{errors.guardianPhone.message}</p>
              )}
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl min-w-32 font-semibold shadow-md shadow-blue-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Register Student"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
