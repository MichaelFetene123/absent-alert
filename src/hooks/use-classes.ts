"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  listClassesWithDetails,
  listAvailableTeachers,
  createClassAction,
  updateClassAction,
  deleteClassAction,
  assignTeacherToClassAction,
  unassignTeacherFromClassAction,
  type ClassItemWithDetails,
} from "@/actions/class.actions";

export function useClassesDetailsQuery(initialData?: ClassItemWithDetails[]) {
  return useQuery({
    queryKey: queryKeys.classes.details(),
    queryFn: () => listClassesWithDetails(),
    initialData,
  });
}

export function useAvailableTeachersQuery(
  initialData?: Array<{ id: string; name: string; email: string }>
) {
  return useQuery({
    queryKey: queryKeys.classes.availableTeachers(),
    queryFn: () => listAvailableTeachers(),
    initialData,
  });
}

export function useCreateClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createClassAction(input),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      }
    },
  });
}

export function useUpdateClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => updateClassAction(input),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      }
    },
  });
}

export function useDeleteClassMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => deleteClassAction(classId),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      }
    },
  });
}

export function useAssignTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { classId: string; teacherId: string }) =>
      assignTeacherToClassAction(input.classId, input.teacherId),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
      }
    },
  });
}

export function useUnassignTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { classId: string; teacherId: string }) =>
      unassignTeacherFromClassAction(input.classId, input.teacherId),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
      }
    },
  });
}
