import { ViewModelBase } from '../../../../../SiteCommon/Web/services/view-model-base'

export class CognitiveText extends ViewModelBase {
    isBingChecked: boolean = false;

    verifyBing() {
        this.isValidated = this.isBingChecked;
    }

    async onNavigatingNext(): Promise<boolean> {
        return await this.MS.HttpService.isExecuteSuccessAsync('Microsoft-RegisterCognitiveServices', { CognitiveLocation: 'westus', CognitiveServices: 'TextAnalytics' }) &&
            await this.MS.HttpService.isExecuteSuccessAsync('Microsoft-RegisterCognitiveServices', { CognitiveLocation: 'global', CognitiveServices: 'Bing.Search' });
    }

    async onLoaded(): Promise<void> {
        this.isValidated = this.isBingChecked;
    }
}