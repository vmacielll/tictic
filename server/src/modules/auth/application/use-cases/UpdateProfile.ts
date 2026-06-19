import { AppError } from '@shared/errors/AppError'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'

interface UpdateProfileRequest {
  userId: string
  name: string
}

interface UpdateProfileResponse {
  id: string
  name: string
  email: string
}

export class UpdateProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ userId, name }: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND')
    }

    user.changeName(name)
    const updated = await this.userRepository.save(user)

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email.toString(),
    }
  }
}
