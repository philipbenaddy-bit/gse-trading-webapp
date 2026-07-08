import { Module, Global } from '@nestjs/common';
import { GseService } from './gse.service';

@Global()
@Module({
  providers: [GseService],
  exports: [GseService],
})
export class GseModule {}
