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
import { Loader2, UserPlus, Save, Phone, School, User, Hash } from "lucide-react";

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
      <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 text-blue-600">
            {isEdit ? <Save className="size-5" /> : <UserPlus className="size-5" />}
            <SheetTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Student" : "Register New Student"}
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-slate-500">
            {isEdit
              ? "Update student information and primary guardian contact details."
              : "Enter student details, class assignment, and primary guardian for SMS notifications."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-4 py-2">
          {/* Admission Number */}
          <div className="space-y-1.5">
            <Label htmlFor="admissionNo" className="text-xs font-semibold flex items-center gap-1.5">
              <Hash className="size-3.5 text-slate-400" />
              Admission Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admissionNo"
              placeholder="e.g. ADM-006"
              {...register("admissionNo")}
              className={errors.admissionNo ? "border-red-500" : ""}
            />
            {errors.admissionNo && (
              <p className="text-xs text-red-600">{errors.admissionNo.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold flex items-center gap-1.5">
              <User className="size-3.5 text-slate-400" />
              Student Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="e.g. Almaz Kebede"
              {...register("fullName")}
              className={errors.fullName ? "border-red-500" : ""}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Class Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="classId" className="text-xs font-semibold flex items-center gap-1.5">
              <School className="size-3.5 text-slate-400" />
              Assigned Class <span className="text-red-500">*</span>
            </Label>
            <select
              id="classId"
              {...register("classId")}
              className="w-full h-8 px-2.5 text-sm rounded-lg border border-input bg-transparent text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors dark:bg-input/30"
            >
              {classes.length === 0 ? (
                <option value="">No classes available</option>
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

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Primary Guardian Details
            </h4>

            {/* Guardian Name */}
            <div className="space-y-1.5 mb-4">
              <Label htmlFor="guardianName" className="text-xs font-semibold flex items-center gap-1.5">
                <User className="size-3.5 text-slate-400" />
                Guardian Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guardianName"
                placeholder="e.g. Kebede Tessema"
                {...register("guardianName")}
                className={errors.guardianName ? "border-red-500" : ""}
              />
              {errors.guardianName && (
                <p className="text-xs text-red-600">{errors.guardianName.message}</p>
              )}
            </div>

            {/* Guardian Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="guardianPhone" className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="size-3.5 text-slate-400" />
                Guardian Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guardianPhone"
                type="tel"
                placeholder="0911223344 or +251911223344"
                {...register("guardianPhone")}
                className={errors.guardianPhone ? "border-red-500" : ""}
              />
              <p className="text-[11px] text-slate-400">
                Ethiopian phone number. Will be normalized to +251 format automatically.
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-24"
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
