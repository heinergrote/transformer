import {Component, effect, input, model, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {XY} from '../../util/xy';

@Component({
  selector: 'app-points-form',
    imports: [
        ReactiveFormsModule
    ],
  templateUrl: './points-form.component.html',
  styleUrl: './points-form.component.css'
})
export class PointsFormComponent {

  points = model<XY[]>([])
  defaultPoints = input<XY[]>([])

  constructor() {

    this.pointsForm.valueChanges.subscribe(() => {
      this.points.set(this.points().map((_, i) => ({
        x: this.pointsForm.get(`x${i + 1}`)?.value,
        y: this.pointsForm.get(`y${i + 1}`)?.value
      })))
    })

    effect(() => {
      this.points().forEach((point, i) => {
        this.pointsForm.controls[`x${i+1}`].setValue(point.x, {emitEvent: false})
        this.pointsForm.controls[`y${i+1}`].setValue(point.y, {emitEvent: false})
      });
    })
  }

  pointsForm: FormGroup  = new FormGroup({
    x1: new FormControl(0),
    y1: new FormControl(0),
    x2: new FormControl(0),
    y2: new FormControl(0),
    x3: new FormControl(0),
    y3: new FormControl(0),
    x4: new FormControl(0),
    y4: new FormControl(0),
  });

  onReset() {
    this.points.set(this.defaultPoints())
  }
}
