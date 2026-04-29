import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Provider, ProviderCompanyDetail, ProviderIndividualDetail } from "../shared/entities";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";

@Module({
    imports:[
        TypeOrmModule.forFeature([
            Provider,
            ProviderIndividualDetail,
            ProviderCompanyDetail,
        ]),
    ],
    controllers:[ProvidersController],
    providers:[ProvidersService],
})
export class ProvidersModule{}