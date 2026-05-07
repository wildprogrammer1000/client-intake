type AwsEnvCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

const resolveAwsEnvCredentials = (): AwsEnvCredentials | undefined => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()
  const sessionToken = process.env.AWS_SESSION_TOKEN?.trim()

  if (!accessKeyId && !secretAccessKey) {
    return undefined
  }

  if (!accessKeyId || !secretAccessKey) {
    console.warn(
      '[aws] AWS_ACCESS_KEY_ID 또는 AWS_SECRET_ACCESS_KEY 중 하나가 누락되어 기본 인증 체인(IAM Role/credentials 파일)을 사용합니다.',
    )
    return undefined
  }

  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  }
}

export const buildAwsClientConfig = (region: string) => {
  const credentials = resolveAwsEnvCredentials()
  return credentials ? { region, credentials } : { region }
}
