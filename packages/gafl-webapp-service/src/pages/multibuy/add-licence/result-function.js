import { CommonResults } from '../../../constants.js'

export default async request => 
  request.payload['add-licence'] === CommonResults.YES 
    ? CommonResults.YES 
    : CommonResults.NO
