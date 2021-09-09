import { Component, OnInit } from '@angular/core';
import { VersionService } from '../version.service';
import { Version, VersionBuild, BuildInfo } from '../version';


interface ExtraDict {
    [index: string]: string;
}


@Component({
    selector: 'app-ver-gen',
    templateUrl: './ver-gen.component.html',
    styleUrls: ['./ver-gen.component.css']
})
export class VerGenComponent implements OnInit {

    versions: Version[] = [];

    constructor(
        private verService: VersionService,
    ) { }

    ngOnInit(): void {
        this.refresh();
    }

    generate(version: Version | undefined, extraOpt: string): void {
        if (typeof version == 'undefined')
            return;

        let extra_info: ExtraDict = {};

        if (extraOpt !== "") {
            extra_info['extra'] = extraOpt;
        }

        const build: VersionBuild = { ver: version, info: extra_info };
        this.verService.generate(build).subscribe();
    }

    refresh(): void {
        this.verService.getVersions()
            .subscribe(versions => this.versions = versions);
    }
}
