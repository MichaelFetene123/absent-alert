"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  listTeachersWithDetails,
  listAvailableClassesForTeachers,
  createTeacherAction,
  updateTeacherAction,
  deleteTeacherAction,
  assignClassesToTeacherAction,
  type TeacherItemWithDetails,
} from "@/actions/teacher.actions";

export function useTeachersDetailsQuery(initialData?: TeacherItemWithDetails[]) {
  return useQuery({
    queryKey: queryKeys.teachers.details(),
    queryFn: () => listTeachersWithDetails(),
    initialData,
  });
}

export function useAvailableClassesQuery(
  initialData?: Array<{ id: string; name: string }>
) {
  return useQuery({
    queryKey: queryKeys.teachers.availableClasses(),
    queryFn: () => listAvailableClassesForTeachers(),
    initialData,
  });
}

export function useCreateTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createTeacherAction(input),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      }
    },
  });
}

export function useUpdateTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => updateTeacherAction(input),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      }
    },
  });
}

export function useDeleteTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teacherId: string) => deleteTeacherAction(teacherId),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      }
    },
  });
}

export function useAssignClassesToTeacherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { teacherId: string; classIds: string[] }) =>
      assignClassesToTeacherAction(input.teacherId, input.classIds),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      }
    },
  });
}
