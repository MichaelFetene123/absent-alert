"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  listStudents,
  listClasses,
  createStudent,
  updateStudent,
  updateGuardian,
  toggleStudentActive,
  deactivateStudent,
  deleteStudent,
  bulkImportStudentsAction,
  type BulkImportRowInput,
} from "@/actions/student.actions";

export type StudentQueryParams = {
  classId?: string;
  search?: string;
  showInactive?: boolean;
};

export type StudentListItem = Awaited<ReturnType<typeof listStudents>>[number];
export type StudentClassItem = Awaited<ReturnType<typeof listClasses>>[number];

export function useStudentsQuery(
  params?: StudentQueryParams,
  initialData?: StudentListItem[]
) {
  return useQuery({
    queryKey: queryKeys.students.list({
      classId: params?.classId,
      search: params?.search,
      status: params?.showInactive ? "all" : "active",
    }),
    queryFn: () => listStudents(params),
    initialData,
  });
}

export function useStudentClassesQuery(initialData?: StudentClassItem[]) {
  return useQuery({
    queryKey: queryKeys.students.classes(),
    queryFn: () => listClasses(),
    initialData,
  });
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createStudent(input),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      }
    },
  });
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => updateStudent(input),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      }
    },
  });
}

export function useUpdateGuardianMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { studentId: string; guardianName: string; guardianPhone: string }) =>
      updateGuardian(input),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      }
    },
  });
}

export function useToggleStudentActiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { studentId: string; active: boolean }) =>
      toggleStudentActive(input.studentId, input.active),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      }
    },
  });
}

export function useBulkImportStudentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { rows: BulkImportRowInput[]; targetClassId?: string }) =>
      bulkImportStudentsAction(input.rows),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      }
    },
  });
}
