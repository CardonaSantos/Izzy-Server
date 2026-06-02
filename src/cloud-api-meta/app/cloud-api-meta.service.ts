import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { WhatsAppTemplatePayload } from '../dto/dto-message-payload';

@Injectable()
export class CloudApiMetaService {
  private readonly logger = new Logger(CloudApiMetaService.name);
  private readonly apiUrl: string;
  private readonly apiToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const phoneId = this.configService.get<string>('WHATSAPP_PHONE_ID');

    if (!phoneId) {
      throw new Error('WHATSAPP_PHONE_ID no está configurado');
    }

    const token = this.configService.get<string>('WHATSAPP_API_TOKEN');

    if (!token) {
      throw new Error('WHATSAPP_API_TOKEN no está configurado');
    }

    this.apiUrl = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    this.apiToken = token;
  }

  async send_message_with_template(payload: WhatsAppTemplatePayload) {
    try {
      this.logger.debug(
        `Payload enviado a Meta:\n${JSON.stringify(payload, null, 2)}`,
      );

      const response = await lastValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Mensaje enviado a ${payload.to}: ${response.status}`);

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const metaError = error.response?.data;

        this.logger.error(
          `Error enviando a Meta para ${payload.to}. Status: ${error.response?.status}`,
        );

        this.logger.error(
          `Respuesta real de Meta:\n${JSON.stringify(metaError, null, 2)}`,
        );

        throw error;
      }

      this.logger.error(`Error desconocido enviando a Meta`, error);
      throw error;
    }
  }
}
