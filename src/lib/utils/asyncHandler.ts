export async function asyncHandler<T = unknown>(
  promise: Promise<T>
): Promise<[T, null] | [null, any]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    return [null, error];
  }
}
