import {Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TransformerComponent} from './transormer/transformer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TransformerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

}
