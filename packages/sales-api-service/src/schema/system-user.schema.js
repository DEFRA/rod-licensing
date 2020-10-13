import Joi from 'joi'

export const systemUsersRequestParamsSchema = Joi.object({
  oid: Joi.string()
    .guid()
    .required()
    .description('The Azure Active Directory Object ID')
}).label('system-user-request-params')

export const systemUsersResponseSchema = Joi.object({
  id: Joi.string()
    .guid()
    .required()
    .description('The Dynamics User ID'),
  oid: Joi.string()
    .guid()
    .required()
    .description('The Azure Active Directory Object ID'),
  firstName: Joi.string()
    .required()
    .description('The system user first name'),
  lastName: Joi.string()
    .required()
    .description('The system user last name'),
  isDisabled: Joi.boolean()
    .required()
    .description('The system user state'),
  roles: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .guid()
          .required()
          .description('The Dynamics Role ID'),
        name: Joi.string()
          .required()
          .description('The role name')
      })
        .required()
        .label('system-user-role')
    )
    .required()
}).label('system-user-response')
