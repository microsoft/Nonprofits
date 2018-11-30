import { ViewModelBase } from '../../../../../SiteCommon/Web/services/view-model-base'

export class CognitiveText extends ViewModelBase {
    isTermsChecked: boolean = false;

    verifyTerms() {
        this.isValidated = this.isTermsChecked;
    }

    async onLoaded(): Promise<void> {
        this.isValidated = this.isTermsChecked;
    }
}