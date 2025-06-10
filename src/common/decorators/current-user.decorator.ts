import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../interfaces/auth.interfaces';

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const request = ctx.switchToHttp().getRequest();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const user = request.user as RequestUser;

  if (data) {
    return user?.[data as keyof RequestUser];
  }

  return user;
});
