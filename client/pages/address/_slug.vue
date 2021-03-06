<template>
    <div
        v-if="loading"
        :class="(loading ? 'tomo-loading tomo-loading--full' : '')"/>
    <section v-else>
        <div class="card tomo-card tomo-card--address">
            <div class="tomo-card__header">
                <h3
                    :class="`tomo-card__headline
                    ${(address && address.isContract ? ' tomo-card__headline--is-contract' : '')}`">
                    <span v-if="address && address.isContract">Contract: </span>
                    <read-more
                        :text="hash"
                        class="d-sm-none" />
                    <read-more
                        :text="hash"
                        :max-chars="20"
                        class="d-none d-sm-inline-block d-lg-none" />
                    <read-more
                        :text="hash"
                        :max-chars="30"
                        class="d-none d-lg-inline-block d-xl-none" />
                    <span class="d-none d-xl-inline-block">{{ hash }}</span>
                </h3>
            </div>
            <div class="tomo-card__body">
                <table class="tomo-card__table">
                    <tbody>
                        <tr>
                            <td>TOMO Balance</td>
                            <td>
                                <span>{{ formatUnit(toTomo(address.balance)) }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td>TOMO USD Value</td>
                            <td>
                                <span>{{ formatNumber(usdPrice * toEtherNumber(address.balance)) }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Transactions</td>
                            <td>
                                <span>{{ txsCount }}</span> txns
                            </td>
                        </tr>
                        <tr v-if="address && !address.isContract">
                            <td>Code</td>
                            <td>
                                <read-more
                                    :text="address.code"
                                    class="d-sm-none" />
                                <read-more
                                    :text="address.code"
                                    :max-chars="20"
                                    class="d-none d-sm-inline-block d-lg-none" />
                                <read-more
                                    :text="address.code"
                                    :max-chars="30"
                                    class="d-none d-lg-inline-block d-xl-none" />
                                <span class="d-none d-xl-inline-block">{{ address.code }}</span>
                            </td>
                        </tr>
                        <tr v-if="address && address.token">
                            <td>Token Contract</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'tokens-slug', params: {slug: address.token.hash}}">
                                    {{ trimWord(address.token.name) }}({{ trimWord(address.token.symbol) }})
                                </nuxt-link>
                            </td>
                        </tr>
                        <tr v-if="address && address.contractCreation">
                            <td>Contract Creator</td>
                            <td>
                                <nuxt-link
                                    :to="{name: 'address-slug', params: {slug: address.contractCreation}}"
                                    class="text-truncate">{{ address.contractCreation }}</nuxt-link>
                                <span>&nbsp;at txns&nbsp;</span>
                                <span v-if="address.fromTxn">
                                    <nuxt-link
                                        :to="{name: 'txs-slug', params: {slug: address.fromTxn}}"
                                        class="text-truncate">{{ address.fromTxn }}</nuxt-link>
                                </span>
                            </td>
                        </tr>
                        <tr
                            v-if="address && address.isContract && ! address.contract"
                            class="is-contract-message">
                            <td>
                                <div>Are you the contract creator?
                                    <nuxt-link :to="{name: 'contracts-verify', query: {address: hash}}">
                                        Verify And Publish
                                    </nuxt-link>
                                    your contract source code today!
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="text-center text-lg-right tomo-qrcode">
                    <div>
                        <button
                            v-clipboard="hash"
                            type="button"
                            class="btn btn-sm mr-2 code-actions__copy"
                            @success="copyAddress">
                        <i class="fa fa-clipboard" /> Copy</button>
                    </div>
                    <div>
                        <vue-qrcode
                            :value="hash"
                            :options="{size: 250}"
                            class="img-fluid"/>
                    </div>
                </div>
            </div>
        </div>

        <b-tabs
            ref="allTabs"
            v-model="tabIndex"
            class="tomo-tabs"
            @input="onSwitchTab">
            <b-tab
                id="transactions"
                :active="hashTab === '#transactions'"
                :title="'Transactions (' + formatNumber(txsCount) + ')'"
                href="#transactions">
                <table-tx
                    v-if="hashTab === '#transactions'"
                    :address="hash"
                    :parent="'#transactions'"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="!address.isContract"
                :active="hashTab === '#minedBlocks'"
                :title="'Created Blocks (' + formatNumber(blocksCount) + ')'"
                href="#minedBlocks">
                <table-tx-by-account
                    v-if="hashTab === '#minedBlocks'"
                    :page="this"
                    :parent="'minedBlocks'"/>
            </b-tab>
            <b-tab
                v-if="address && address.hashTokens"
                :active="hashTab === '#tokenHolding'"
                :title="'Token Holding (' + formatNumber(tokensCount) + ')'"
                href="#tokenHolding">
                <table-tokens-by-account
                    v-if="hashTab === '#tokenHolding'"
                    :address="hash"
                    :parent="'tokenHolding'"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="address && address.isContract"
                :active="hashTab === '#code'"
                title="Code"
                href="#code"
                @click="refreshCodeMirror">
                <read-source-code
                    ref="readSourceCode"
                    :token="hash"
                    :smartcontract="smartContract"
                    :address="address"/>
            </b-tab>
            <b-tab
                v-if="address && address.isContract && smartContract"
                id="readContract"
                :active="hashTab === '#readContract'"
                title="Read Contract"
                href="#readContract">
                <read-contract
                    :contract="hash"/>
            </b-tab>
            <b-tab
                id="events"
                :active="hashTab === '#events'"
                :title="'Events (' + formatNumber(eventsCount) + ')'"
                href="#events">
                <table-event
                    v-if="hashTab === '#events'"
                    :address="hash"
                    :parent="'events'"
                    :page="this"/>
            </b-tab>
            <b-tab
                v-if="hasReward && !address.isContract"
                id="rewards"
                :active="hashTab === '#rewards'"
                :title="'Rewards (' + formatNumber(rewardTime) + ')'"
                href="#rewards">
                <table-reward
                    v-if="hashTab === '#rewards'"
                    :address="hash"
                    :parent="'rewards'"
                    :page="this"/>
            </b-tab>
        </b-tabs>
    </section>
</template>
<script>
import mixin from '~/plugins/mixin'
import TableTx from '~/components/TableTx'
import TableTokensByAccount from '~/components/TableTokensByAccount'
import TableTxByAccount from '~/components/TableTxByAccount'
import TableEvent from '~/components/TableEvent'
import ReadMore from '~/components/ReadMore'
import VueQrcode from '@xkeshi/vue-qrcode'
import ReadContract from '~/components/ReadContract'
import TableReward from '~/components/TableReward'
import ReadSourceCode from '~/components/ReadSourceCode'

export default {
    components: {
        ReadSourceCode,
        TableTx,
        TableTokensByAccount,
        TableTxByAccount,
        TableEvent,
        ReadMore,
        VueQrcode,
        ReadContract,
        TableReward
    },
    mixins: [mixin],
    head () {
        return {
            title: 'Address ' + this.hash
        }
    },
    data: () => ({
        hash: null,
        address: null,
        smartContract: null,
        txsCount: 0,
        blocksCount: 0,
        eventsCount: 0,
        tokensCount: 0,
        loading: true,
        hasReward: true,
        rewardTime: 0,
        tabIndex: 0
    }),
    computed: {
        usdPrice () {
            return this.$store.state.app.usdPrice
        },
        codemirror () {
            return [
                this.$refs.tomoCmSourceCode.codemirror,
                this.$refs.tomoCmAbiCode.codemirror,
                this.$refs.tomoCmCode.codemirror
            ]
        },
        hashTab () {
            return this.$route.hash || '#transactions'
        }
    },
    created () {
        let hash = this.$route.params.slug
        if (hash) {
            this.hash = hash
        }
    },
    mounted () {
        let self = this

        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', {
            name: 'address-slug',
            to: { name: 'address-slug', params: { slug: self.hash } }
        })

        self.getAccountFromApi()
        self.getUSDPrice()
    },
    methods: {
        async getAccountFromApi () {
            let self = this

            self.loading = true
            let params = {}

            if (self.hash) {
                params.address = self.hash
            }

            params.list = 'address'

            let query = this.serializeQuery(params)

            let responses = await Promise.all([
                this.$axios.get('/api/accounts/' + self.hash),
                this.$axios.get('/api/counting' + '?' + query)
            ])

            self.address = responses[0].data
            self.smartContract = responses[0].data.contract

            self.blocksCount = responses[1].data.minedBlocks

            self.eventsCount = responses[1].data.events

            self.txsCount = responses[1].data.txes

            self.rewardTime = responses[1].data.rewards

            self.tokensCount = responses[1].data.tokenHolders

            self.loading = false
        },
        async getUSDPrice () {
            let self = this

            self.$store.dispatch('app/getUSDPrice')
        },
        onSwitchTab: function () {
            const allTabs = this.$refs.allTabs
            const location = window.location
            const value = this.tabIndex
            if (allTabs) {
                if (location.hash !== allTabs.tabs[value].href) {
                    this.$router.replace({
                        hash: allTabs.tabs[value].href
                    })
                } else {
                    location.hash = allTabs.tabs[value].href
                }
            }
        },
        copyAddress () {
            this.$toast.show('Copied')
        }
    }
}
</script>
