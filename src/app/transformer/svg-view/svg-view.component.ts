import {Component, computed, input} from '@angular/core';
import {identityMatrix, TransformMatrix, TransformType} from '../../util/homography';

@Component({
  selector: 'app-svg-view',
  imports: [],
  templateUrl: './svg-view.component.html',
  styleUrl: './svg-view.component.css'
})
export class SvgViewComponent {

  transform = input<TransformMatrix>(identityMatrix)
  transformType = input<TransformType>('perspective')

  svgTransformMatrix = computed(() => "matrix(" +
    this.transform().a + " " + this.transform().d + " " + this.transform().b + " " +
    this.transform().e + " " + this.transform().c + " " + this.transform().f + ")")

}
