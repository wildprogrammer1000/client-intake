const getMissingEnvKeys = (keys: string[]): string[] => {
  return keys.filter((key) => {
    const value = process.env[key]
    return !value || !value.trim()
  })
}

export const assertRequiredEnv = (keys: string[]): void => {
  const missingKeys = getMissingEnvKeys(keys)
  if (!missingKeys.length) {
    return
  }

  throw new Error(`필수 환경변수가 누락되었습니다: ${missingKeys.join(', ')}`)
}
