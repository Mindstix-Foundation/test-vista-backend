import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoardModule } from './modules/board/board.module';
import { AddressModule } from './modules/address/address.module';
import { CityModule } from './modules/city/city.module';
import { StateModule } from './modules/state/state.module';
import { CountryModule } from './modules/country/country.module';

@Module({
  imports: [
    CountryModule,
    StateModule,
    CityModule,
    AddressModule,
    BoardModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
