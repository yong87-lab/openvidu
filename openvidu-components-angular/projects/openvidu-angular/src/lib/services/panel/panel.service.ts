import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ILogger } from '../../models/logger.model';
import { PanelType } from '../../models/panel.model';
import { LoggerService } from '../logger/logger.service';

@Injectable({
	providedIn: 'root'
})
export class PanelService {
	/**
	 * Panel Observable which pushes the panel status in every update.
	 */
	panelOpenedObs: Observable<{ opened: boolean; type?: PanelType | string }>;
	protected log: ILogger;
	protected isChatOpened: boolean = false;
	protected isParticipantsOpened: boolean = false;
	protected isActivitiesOpened: boolean = false;
	private isExternalOpened: boolean = false;
	private externalType: string;
	protected _panelOpened = <BehaviorSubject<{ opened: boolean; type?: PanelType | string, expand?: string }>>new BehaviorSubject({ opened: false });

	/**
	 * @internal
	 */
	constructor(protected loggerSrv: LoggerService) {
		this.log = this.loggerSrv.get('PanelService');
		this.panelOpenedObs = this._panelOpened.asObservable();
	}

	/**
	 * Open or close the panel type received. Calling this method with the panel opened and the same type panel, will close the panel.
	 * If the type is differente, it will switch to the properly panel.
	 */
	togglePanel(type: PanelType | string, expand?: string) {
		this.log.d(`Toggling ${type} menu`);
		let opened: boolean;
		if (type === PanelType.CHAT) {
			this.isChatOpened = !this.isChatOpened;
			this.isParticipantsOpened = false;
			this.isExternalOpened = false;
			this.isActivitiesOpened = false
			opened = this.isChatOpened;
		} else if (type === PanelType.PARTICIPANTS) {
			this.isParticipantsOpened = !this.isParticipantsOpened;
			this.isChatOpened = false;
			this.isExternalOpened = false;
			this.isActivitiesOpened = false;
			opened = this.isParticipantsOpened;
		} else if (type === PanelType.ACTIVITIES) {
			this.isActivitiesOpened = !this.isActivitiesOpened;
			this.isChatOpened = false;
			this.isExternalOpened = false;
			this.isParticipantsOpened = false;
			opened = this.isActivitiesOpened;
		} else {
			this.log.d('Toggling external panel');
			this.isChatOpened = false;
			this.isParticipantsOpened = false;
			this.isActivitiesOpened = false;
			// Open when is close or is opened with another type
			this.isExternalOpened = !this.isExternalOpened || this.externalType !== type;
			this.externalType = !this.isExternalOpened ? '' : type;
			opened = this.isExternalOpened;
		}

		this._panelOpened.next({ opened, type, expand });
	}

	/**
	 * @internal
	 */
	isPanelOpened(): boolean {
		return this.isChatPanelOpened() || this.isParticipantsPanelOpened() || this.isActivitiesPanelOpened() || this.isExternalPanelOpened();
	}

	/**
	 * Closes the panel (if opened)
	 */
	closePanel(): void {
		this.isParticipantsOpened = false;
		this.isChatOpened = false;
		this.isExternalOpened = false;
		this.isActivitiesOpened = false;
		this._panelOpened.next({ opened: false });
	}

	/**
	 * Whether the chat panel is opened or not.
	 */
	isChatPanelOpened(): boolean {
		return this.isChatOpened;
	}

	/**
	 * Whether the participants panel is opened or not.
	 */
	isParticipantsPanelOpened(): boolean {
		return this.isParticipantsOpened;
	}

	/**
	 * Whether the activities panel is opened or not.
	 */
	 isActivitiesPanelOpened(): boolean {
		return this.isActivitiesOpened;
	}

	isExternalPanelOpened(): boolean {
		return this.isExternalOpened;
	}
}
