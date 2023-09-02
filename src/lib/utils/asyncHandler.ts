export async function asyncHandler<T = unknown>(
  promise: Promise<T>
): Promise<{ success: true; result: T } | { success: false; error: Error | any }> {
  try {
    const result = await promise;
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}
