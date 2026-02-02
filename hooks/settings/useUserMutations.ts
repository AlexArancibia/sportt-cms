import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import apiClient from "@/lib/axiosConfig"
import { extractApiData } from "@/lib/apiHelpers"
import type { User, CreateUserDto, UpdateUserDto } from "@/types/user"

async function createUser(user: CreateUserDto): Promise<User> {
  const response = await apiClient.post<User>("/auth/register", user)
  return extractApiData(response)
}

async function updateUser(id: string, user: UpdateUserDto): Promise<User> {
  const response = await apiClient.patch<User>(`/auth/${id}`, user)
  return extractApiData(response)
}

async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/auth/${id}`)
}

export function useUserMutations(storeId: string | null) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    if (storeId) queryClient.invalidateQueries({ queryKey: queryKeys.users.byStore(storeId) })
  }

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, user }: { id: string; user: UpdateUserDto }) =>
      updateUser(id, user),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: invalidate,
  })

  return {
    createUser: createMutation.mutateAsync,
    updateUser: (id: string, user: UpdateUserDto) =>
      updateMutation.mutateAsync({ id, user }),
    deleteUser: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
