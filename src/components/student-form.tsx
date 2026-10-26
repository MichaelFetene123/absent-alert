"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, type StudentInput } from "@/lib/validations/student";
import { createStudent, updateStudent } from "@/actions/student.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-border p-6">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              {isEdit ? <Save className="size-5" /> : <UserPlus className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {isEdit ? "Edit Student Profile" : "Register New Student"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEdit
                  ? "Update academic records and guardian mobile details"
                  : "Add student to active classroom roster with guardian mobile alert phone"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* Admission Number */}
          <div className="space-y-1.5">
            <Label htmlFor="admissionNo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Hash className="size-3.5 text-muted-foreground" />
              Admission Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="admissionNo"
              placeholder="e.g. ADM-008"
              {...register("admissionNo")}
              className={`h-10 rounded-xl font-mono text-sm ${errors.admissionNo ? "border-destructive" : ""}`}
            />
            {errors.admissionNo && (
              <p className="text-xs text-destructive">{errors.admissionNo.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-muted-foreground" />
              Student Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="e.g. Almaz Kebede"
              {...register("fullName")}
              className={`h-10 rounded-xl font-semibold ${errors.fullName ? "border-destructive" : ""}`}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Class Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="classId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <School className="size-3.5 text-muted-foreground" />
              Assigned Classroom <span className="text-destructive">*</span>
            </Label>
            <select
              id="classId"
              {...register("classId")}
              className="w-full h-10 px-3 text-sm font-semibold rounded-xl border border-border bg-background text-foreground outline-none"
            >
              {classes.length === 0 ? (
                <option value="">No classrooms available</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))
              )}
            </select>
            {errors.classId && (
              <p className="text-xs text-destructive">{errors.classId.message}</p>
            )}
          </div>

          <div className="pt-3 border-t border-border space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-primary/10 text-primary">
                <Smartphone className="size-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Primary Guardian &amp; SMS Destination
              </h4>
            </div>

            {/* Guardian Name */}
            <div className="space-y-1.5">
              <Label htmlFor="guardianName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-muted-foreground" />
                Guardian Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guardianName"
                placeholder="e.g. Kebede Tessema"
                {...register("guardianName")}
                className={`h-10 rounded-xl font-semibold ${errors.guardianName ? "border-destructive" : ""}`}
              />
              {errors.guardianName && (
                <p className="text-xs text-destructive">{errors.guardianName.message}</p>
              )}
            </div>

            {/* Guardian Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="guardianPhone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                Guardian Mobile Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guardianPhone"
                type="tel"
                placeholder="0911223344 or +251911223344"
                {...register("guardianPhone")}
                className={`h-10 rounded-xl font-mono text-sm ${errors.guardianPhone ? "border-destructive" : ""}`}
              />
              {errors.guardianPhone && (
                <p className="text-xs text-destructive">{errors.guardianPhone.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex gap-2 sm:justify-end">
            <Button
              type="button"
              id="student-form-cancel-btn"
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
              id="student-form-submit-btn"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl min-w-32 font-semibold"
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
