export interface WhatsAppTemplatePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: TemplateData;
}

export interface TemplateData {
  name: string;
  language: {
    code: string;
  };
  components?: TemplateComponent[];
}

interface TemplateComponent {
  type: 'body' | 'header' | 'button';
  parameters: TemplateParameter[];
}

interface TemplateParameter {
  type: 'text';
  text: string;
}
