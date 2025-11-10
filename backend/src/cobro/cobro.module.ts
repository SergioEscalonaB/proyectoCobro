import { Module } from '@nestjs/common';
import { CobroService } from './cobro.service';
import { CobroController } from './cobro.controller';
import {PrismaModule} from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CobroController],
  providers: [CobroService],
})
export class CobroModule {}
