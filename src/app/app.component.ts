import {Component, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {CanvasComponent} from './canvas/canvas.component';
import {TransformType} from './util/homography';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

}
