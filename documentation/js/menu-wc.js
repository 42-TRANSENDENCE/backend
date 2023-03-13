'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">transcendence-backend documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-AppModule-b1a191d96cf8a42bcc7ca182cc909985dad984c02050d3c31031ddb0d09d7cefe6448f26c2e7882886acd1f4202ddf7c3962d05065a5dfc08d4612a9fbb76366"' : 'data-target="#xs-controllers-links-module-AppModule-b1a191d96cf8a42bcc7ca182cc909985dad984c02050d3c31031ddb0d09d7cefe6448f26c2e7882886acd1f4202ddf7c3962d05065a5dfc08d4612a9fbb76366"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-b1a191d96cf8a42bcc7ca182cc909985dad984c02050d3c31031ddb0d09d7cefe6448f26c2e7882886acd1f4202ddf7c3962d05065a5dfc08d4612a9fbb76366"' :
                                            'id="xs-controllers-links-module-AppModule-b1a191d96cf8a42bcc7ca182cc909985dad984c02050d3c31031ddb0d09d7cefe6448f26c2e7882886acd1f4202ddf7c3962d05065a5dfc08d4612a9fbb76366"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-b1a191d96cf8a42bcc7ca182cc909985dad984c02050d3c31031ddb0d09d7cefe6448f26c2e7882886acd1f4202ddf7c3962d05065a5dfc08d4612a9fbb76366"' : 'data-target="#xs-injectables-links-module-AppModule-b1a191d96cf8a42bcc7ca182cc909985dad984c02050d3c31031ddb0d09d7cefe6448f26c2e7882886acd1f4202ddf7c3962d05065a5dfc08d4612a9fbb76366"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-b1a191d96cf8a42bcc7ca182cc909985dad984c02050d3c31031ddb0d09d7cefe6448f26c2e7882886acd1f4202ddf7c3962d05065a5dfc08d4612a9fbb76366"' :
                                        'id="xs-injectables-links-module-AppModule-b1a191d96cf8a42bcc7ca182cc909985dad984c02050d3c31031ddb0d09d7cefe6448f26c2e7882886acd1f4202ddf7c3962d05065a5dfc08d4612a9fbb76366"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-AuthModule-7c2f1669f30e685fd4c1616b7e3c5d01a310bb055ad6961ccc2f892e299297b1c22aa8db498daf3082644f5281d5056935bdef77b526db466bc81c065f71903e"' : 'data-target="#xs-controllers-links-module-AuthModule-7c2f1669f30e685fd4c1616b7e3c5d01a310bb055ad6961ccc2f892e299297b1c22aa8db498daf3082644f5281d5056935bdef77b526db466bc81c065f71903e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-7c2f1669f30e685fd4c1616b7e3c5d01a310bb055ad6961ccc2f892e299297b1c22aa8db498daf3082644f5281d5056935bdef77b526db466bc81c065f71903e"' :
                                            'id="xs-controllers-links-module-AuthModule-7c2f1669f30e685fd4c1616b7e3c5d01a310bb055ad6961ccc2f892e299297b1c22aa8db498daf3082644f5281d5056935bdef77b526db466bc81c065f71903e"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/TwoFactorAuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TwoFactorAuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AuthModule-7c2f1669f30e685fd4c1616b7e3c5d01a310bb055ad6961ccc2f892e299297b1c22aa8db498daf3082644f5281d5056935bdef77b526db466bc81c065f71903e"' : 'data-target="#xs-injectables-links-module-AuthModule-7c2f1669f30e685fd4c1616b7e3c5d01a310bb055ad6961ccc2f892e299297b1c22aa8db498daf3082644f5281d5056935bdef77b526db466bc81c065f71903e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-7c2f1669f30e685fd4c1616b7e3c5d01a310bb055ad6961ccc2f892e299297b1c22aa8db498daf3082644f5281d5056935bdef77b526db466bc81c065f71903e"' :
                                        'id="xs-injectables-links-module-AuthModule-7c2f1669f30e685fd4c1616b7e3c5d01a310bb055ad6961ccc2f892e299297b1c22aa8db498daf3082644f5281d5056935bdef77b526db466bc81c065f71903e"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtRefreshStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtRefreshStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtTwoFactorStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtTwoFactorStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TwoFactorAuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TwoFactorAuthService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ChannelsModule.html" data-type="entity-link" >ChannelsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-ChannelsModule-2286d491ddef88152bc4f478278efd926f30dbfe205b94694462d94c08a8830000f8cb2b6408baea264874a13d7dfbd728a210a0892586283394a3144917329b"' : 'data-target="#xs-controllers-links-module-ChannelsModule-2286d491ddef88152bc4f478278efd926f30dbfe205b94694462d94c08a8830000f8cb2b6408baea264874a13d7dfbd728a210a0892586283394a3144917329b"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ChannelsModule-2286d491ddef88152bc4f478278efd926f30dbfe205b94694462d94c08a8830000f8cb2b6408baea264874a13d7dfbd728a210a0892586283394a3144917329b"' :
                                            'id="xs-controllers-links-module-ChannelsModule-2286d491ddef88152bc4f478278efd926f30dbfe205b94694462d94c08a8830000f8cb2b6408baea264874a13d7dfbd728a210a0892586283394a3144917329b"' }>
                                            <li class="link">
                                                <a href="controllers/ChannelsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChannelsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-ChannelsModule-2286d491ddef88152bc4f478278efd926f30dbfe205b94694462d94c08a8830000f8cb2b6408baea264874a13d7dfbd728a210a0892586283394a3144917329b"' : 'data-target="#xs-injectables-links-module-ChannelsModule-2286d491ddef88152bc4f478278efd926f30dbfe205b94694462d94c08a8830000f8cb2b6408baea264874a13d7dfbd728a210a0892586283394a3144917329b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ChannelsModule-2286d491ddef88152bc4f478278efd926f30dbfe205b94694462d94c08a8830000f8cb2b6408baea264874a13d7dfbd728a210a0892586283394a3144917329b"' :
                                        'id="xs-injectables-links-module-ChannelsModule-2286d491ddef88152bc4f478278efd926f30dbfe205b94694462d94c08a8830000f8cb2b6408baea264874a13d7dfbd728a210a0892586283394a3144917329b"' }>
                                        <li class="link">
                                            <a href="injectables/ChannelsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChannelsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ChatsModule.html" data-type="entity-link" >ChatsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-ChatsModule-316275e961cb85833eb2ffc3d508148e647bd4a69e2d8354672a19b9c71ba2ae5a58495c5a0af1c30e4a3e82404570a0cfb4aef630bd2e26d9e8da12f138c003"' : 'data-target="#xs-controllers-links-module-ChatsModule-316275e961cb85833eb2ffc3d508148e647bd4a69e2d8354672a19b9c71ba2ae5a58495c5a0af1c30e4a3e82404570a0cfb4aef630bd2e26d9e8da12f138c003"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ChatsModule-316275e961cb85833eb2ffc3d508148e647bd4a69e2d8354672a19b9c71ba2ae5a58495c5a0af1c30e4a3e82404570a0cfb4aef630bd2e26d9e8da12f138c003"' :
                                            'id="xs-controllers-links-module-ChatsModule-316275e961cb85833eb2ffc3d508148e647bd4a69e2d8354672a19b9c71ba2ae5a58495c5a0af1c30e4a3e82404570a0cfb4aef630bd2e26d9e8da12f138c003"' }>
                                            <li class="link">
                                                <a href="controllers/ChatsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChatsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-ChatsModule-316275e961cb85833eb2ffc3d508148e647bd4a69e2d8354672a19b9c71ba2ae5a58495c5a0af1c30e4a3e82404570a0cfb4aef630bd2e26d9e8da12f138c003"' : 'data-target="#xs-injectables-links-module-ChatsModule-316275e961cb85833eb2ffc3d508148e647bd4a69e2d8354672a19b9c71ba2ae5a58495c5a0af1c30e4a3e82404570a0cfb4aef630bd2e26d9e8da12f138c003"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ChatsModule-316275e961cb85833eb2ffc3d508148e647bd4a69e2d8354672a19b9c71ba2ae5a58495c5a0af1c30e4a3e82404570a0cfb4aef630bd2e26d9e8da12f138c003"' :
                                        'id="xs-injectables-links-module-ChatsModule-316275e961cb85833eb2ffc3d508148e647bd4a69e2d8354672a19b9c71ba2ae5a58495c5a0af1c30e4a3e82404570a0cfb4aef630bd2e26d9e8da12f138c003"' }>
                                        <li class="link">
                                            <a href="injectables/ChatsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChatsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DatabaseModule.html" data-type="entity-link" >DatabaseModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/EventsModule.html" data-type="entity-link" >EventsModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/GameModule.html" data-type="entity-link" >GameModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-GameModule-c18dcef39f45234059d0d0278434e55c506ae6d528a2fccf82d1289b51282b711da8e88e950c421152edcbba5dd2d7998d15e454125c05244512271d0c09d245"' : 'data-target="#xs-injectables-links-module-GameModule-c18dcef39f45234059d0d0278434e55c506ae6d528a2fccf82d1289b51282b711da8e88e950c421152edcbba5dd2d7998d15e454125c05244512271d0c09d245"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-GameModule-c18dcef39f45234059d0d0278434e55c506ae6d528a2fccf82d1289b51282b711da8e88e950c421152edcbba5dd2d7998d15e454125c05244512271d0c09d245"' :
                                        'id="xs-injectables-links-module-GameModule-c18dcef39f45234059d0d0278434e55c506ae6d528a2fccf82d1289b51282b711da8e88e950c421152edcbba5dd2d7998d15e454125c05244512271d0c09d245"' }>
                                        <li class="link">
                                            <a href="injectables/GameService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GameService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LobbyService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LobbyService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersModule.html" data-type="entity-link" >UsersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-UsersModule-980e3465cc71b6c7e0809cc45614f2b6b0e717546ef9380e9211c335697d132f7bf56717b6009550d891801dacf04af248dce18105a06a6774b72895d14a29ee"' : 'data-target="#xs-controllers-links-module-UsersModule-980e3465cc71b6c7e0809cc45614f2b6b0e717546ef9380e9211c335697d132f7bf56717b6009550d891801dacf04af248dce18105a06a6774b72895d14a29ee"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-980e3465cc71b6c7e0809cc45614f2b6b0e717546ef9380e9211c335697d132f7bf56717b6009550d891801dacf04af248dce18105a06a6774b72895d14a29ee"' :
                                            'id="xs-controllers-links-module-UsersModule-980e3465cc71b6c7e0809cc45614f2b6b0e717546ef9380e9211c335697d132f7bf56717b6009550d891801dacf04af248dce18105a06a6774b72895d14a29ee"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-UsersModule-980e3465cc71b6c7e0809cc45614f2b6b0e717546ef9380e9211c335697d132f7bf56717b6009550d891801dacf04af248dce18105a06a6774b72895d14a29ee"' : 'data-target="#xs-injectables-links-module-UsersModule-980e3465cc71b6c7e0809cc45614f2b6b0e717546ef9380e9211c335697d132f7bf56717b6009550d891801dacf04af248dce18105a06a6774b72895d14a29ee"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-980e3465cc71b6c7e0809cc45614f2b6b0e717546ef9380e9211c335697d132f7bf56717b6009550d891801dacf04af248dce18105a06a6774b72895d14a29ee"' :
                                        'id="xs-injectables-links-module-UsersModule-980e3465cc71b6c7e0809cc45614f2b6b0e717546ef9380e9211c335697d132f7bf56717b6009550d891801dacf04af248dce18105a06a6774b72895d14a29ee"' }>
                                        <li class="link">
                                            <a href="injectables/UsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#entities-links"' :
                                'data-target="#xs-entities-links"' }>
                                <span class="icon ion-ios-apps"></span>
                                <span>Entities</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="entities-links"' : 'id="xs-entities-links"' }>
                                <li class="link">
                                    <a href="entities/ChannelMember.html" data-type="entity-link" >ChannelMember</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Channels.html" data-type="entity-link" >Channels</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Chats.html" data-type="entity-link" >Chats</a>
                                </li>
                                <li class="link">
                                    <a href="entities/User.html" data-type="entity-link" >User</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ChannelsGateway.html" data-type="entity-link" >ChannelsGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChatGateway.html" data-type="entity-link" >ChatGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateChannelDto.html" data-type="entity-link" >CreateChannelDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserDto.html" data-type="entity-link" >CreateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/GameGateway.html" data-type="entity-link" >GameGateway</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginConsumer.html" data-type="entity-link" >LoginConsumer</a>
                            </li>
                            <li class="link">
                                <a href="classes/TwoFactorTokenDto.html" data-type="entity-link" >TwoFactorTokenDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/JwtAuthGuard.html" data-type="entity-link" >JwtAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtRefreshAuthGuard.html" data-type="entity-link" >JwtRefreshAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtTwoFactorGuard.html" data-type="entity-link" >JwtTwoFactorGuard</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#guards-links"' :
                            'data-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AuthSessionGuard.html" data-type="entity-link" >AuthSessionGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/FourtyTwoGuard.html" data-type="entity-link" >FourtyTwoGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Ball.html" data-type="entity-link" >Ball</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FourtyTwoToken.html" data-type="entity-link" >FourtyTwoToken</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Gameinfo.html" data-type="entity-link" >Gameinfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtTokenPayload.html" data-type="entity-link" >JwtTokenPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Player.html" data-type="entity-link" >Player</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QRCodeUrl.html" data-type="entity-link" >QRCodeUrl</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Roominfo.html" data-type="entity-link" >Roominfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SessionPayload.html" data-type="entity-link" >SessionPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vector2D.html" data-type="entity-link" >Vector2D</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});