import { DireflowComponent } from 'direflow-component';
import App from './App';

export default DireflowComponent.create({
  component: App,
  configuration: {
    tagname: 'chat-component',
  },
  plugins: [
    {
      name: 'font-loader',
      options: {
        google: {
          families: ['Poppins', 'Montserrat'],
        },
      },
    },
  ],
});
