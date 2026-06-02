import { Controller, Post, Body } from '@nestjs/common';
import { CloudApiMetaService } from '../app/cloud-api-meta.service';
import { WhatsAppTemplatePayload } from '../dto/dto-message-payload';

@Controller('cloud-api-meta')
export class CloudApiMetaController {
  constructor(private readonly repoApiMeta: CloudApiMetaService) {}
}
