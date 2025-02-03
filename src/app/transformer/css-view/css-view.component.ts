import {Component, computed, input} from '@angular/core';
import {NgStyle} from '@angular/common';
import {identityMatrix, TransformMatrix} from '../../util/homography';

@Component({
  selector: 'app-css-view',
  imports: [
    NgStyle
  ],
  templateUrl: './css-view.component.html',
  styleUrl: './css-view.component.css'
})
export class CssViewComponent {

  transform = input<TransformMatrix>(identityMatrix)

  cssTransformMatrix3d = computed(() => "matrix3d(" +
    this.transform().a + ',' + this.transform().d + ',0,' + this.transform().g + ',' +
    this.transform().b + ',' + this.transform().e + ',0,' + this.transform().h + ',' +
    '0,0,1,0,' +
    this.transform().c + ',' + this.transform().f + ',0,' + this.transform().i +")")


}
