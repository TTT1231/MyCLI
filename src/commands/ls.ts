import { TEMPLATES } from '../templates-settings';

export async function listTemplates(): Promise<void> {
   const templates = Object.values(TEMPLATES);

   if (templates.length === 0) {
      console.log('No templates available.');
      return;
   }

   Object.values(TEMPLATES).forEach(template => {
      console.log(` - ${template.name}`);
   });
}
