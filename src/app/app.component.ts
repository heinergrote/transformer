import {Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {TransformerComponent} from './transformer/transformer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TransformerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

}
