// utils/lists.js - Listes de sites et catégories à bloquer

/**
 * Catégories de sites avec leurs domaines
 */
export const CATEGORIES = {
  socialMedia: {
    name: 'Réseaux Sociaux',
    domains: [
      'facebook.com',
      'instagram.com',
      'tiktok.com',
      'snapchat.com',
      'twitter.com',
      'x.com',
      'threads.net',
      'pinterest.com',
      'tumblr.com',
      'reddit.com',
      'linkedin.com',
      'whatsapp.com',
      'telegram.org',
      'discord.com',
      'twitch.tv'
    ]
  },

  musicStreaming: {
    name: 'Streaming Musical',
    domains: [
      'spotify.com',
      'deezer.com',
      'soundcloud.com',
      'music.apple.com',
      'music.youtube.com',
      'tidal.com',
      'pandora.com',
      'audiomack.com',
      'bandcamp.com',
      'last.fm'
    ]
  },

  videoStreaming: {
    name: 'Streaming Vidéo',
    domains: [
      'netflix.com',
      'primevideo.com',
      'disneyplus.com',
      'hulu.com',
      'hbomax.com',
      'crunchyroll.com',
      'dailymotion.com',
      'vimeo.com',
      'twitch.tv'
    ]
  },

  dating: {
    name: 'Sites de Rencontre',
    domains: [
      'tinder.com',
      'bumble.com',
      'match.com',
      'okcupid.com',
      'pof.com',
      'badoo.com',
      'hinge.co',
      'meetic.com',
      'happn.com',
      'grindr.com'
    ]
  },

  gaming: {
    name: 'Jeux en Ligne',
    domains: [
      'store.steampowered.com',
      'store.epicgames.com',
      'roblox.com',
      'minecraft.net',
      'fortnite.com',
      'leagueoflegends.com',
      'playstation.com',
      'xbox.com',
      'nintendo.com',
      'origin.com',
      'battle.net'
    ]
  },

  adult: {
    name: 'Contenu Adulte',
    domains: [
      // Liste étendue de domaines adultes
      'pornhub.com',
      'xvideos.com',
      'xnxx.com',
      'redtube.com',
      'youporn.com',
      'xhamster.com',
      'tube8.com',
      'spankbang.com',
      'onlyfans.com',
      'chaturbate.com',
      'cam4.com',
      'myfreecams.com',
      'livejasmin.com',
      'stripchat.com',
      'bongacams.com'
    ]
  },

  reddit: {
    name: 'Reddit & Forums',
    domains: [
      'reddit.com',
      '4chan.org',
      '8kun.top',
      'voat.co',
      'somethingawful.com'
    ]
  }
};

/**
 * Mots-clés suspects dans les URLs
 */
export const SUSPICIOUS_KEYWORDS = [
  // Musique
  'music', 'song', 'mp3', 'audio', 'listen', 'playlist',
  'spotify', 'deezer',

  // Rencontres
  'dating', 'date', 'meet', 'flirt', 'hookup', 'romance',

  // Jeux d'argent
  'casino', 'gambling', 'bet', 'poker', 'slots', 'lottery',

  // Adulte
  'porn', 'xxx', 'sex', 'adult', 'nude', 'nsfw', 'webcam',
  'escort', 'hentai', 'onlyfans',

  // Streaming
  'stream', 'watch', 'video', 'movie', 'series', 'episode'
];

/**
 * Sites islamiques (whitelist par défaut)
 */
export const ISLAMIC_SITES = [
  'quran.com',
  'islamqa.info',
  'seekersguidance.org',
  'bayyinah.tv',
  'muslimmatters.org',
  'yaqeeninstitute.org',
  'islamicfinder.org',
  'dar-alifta.org',
  'islamweb.net',
  'islamhouse.com',
  'salatomatic.com',
  'muslim.sg',
  'muslimpro.com',
  'aladhan.com',
  'sunnah.com',
  'hadithoftheday.com',
  'aboutislam.net',
  'productivemuslim.com',
  'muslimcentral.com',
  'almaghrib.org',
  'zaytuna.edu'
];

/**
 * Sites éducatifs généraux (whitelist)
 */
export const EDUCATIONAL_SITES = [
  'wikipedia.org',
  'wikihow.com',
  'khanacademy.org',
  'coursera.org',
  'edx.org',
  'udemy.com',
  'duolingo.com',
  'stackoverflow.com',
  'github.com',
  'scholar.google.com',
  'arxiv.org',
  'wolframalpha.com',
  'ted.com',
  'nationalgeographic.com',
  'britannica.com'
];

/**
 * Liste recommandée complète (500+ sites)
 */
export function getRecommendedBlockList() {
  const allBlocked = [];

  // Ajoute toutes les catégories sauf educational
  for (const category of Object.values(CATEGORIES)) {
    allBlocked.push(...category.domains);
  }

  // Ajoute des sites supplémentaires
  const additional = [

    // RÉSEAUX SOCIAUX (50+)
    // ============================================
    'facebook.com',
    'fb.com',
    'messenger.com',
    'instagram.com',
    'tiktok.com',
    'snapchat.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'pinterest.com',
    'reddit.com',
    'tumblr.com',
    'myspace.com',
    'vine.co',
    'periscope.tv',
    'bigo.tv',
    'viber.com',
    'telegram.org',
    'discord.com',
    'nextdoor.com',
    'meetup.com',
    'quora.com',
    'medium.com',
    'wattpad.com',
    'amino.com',
    'flickr.com',
    'vimeo.com',
    'dailymotion.com',
    'weibo.com',
    'qq.com',
    'wechat.com',
    'viber.com',
    'line.me',
    'kakaotalk.com',
    'whatsapp.com',
    'signal.org',
    'threema.ch',
    'wickr.com',
    'kik.com',
    'omegle.com',
    'chatroulette.com',
    'azar.page',
    'monkey.co',
    'houseparty.com',
    'bunch.com',
    'together.com',
    'lively.com',
    'patreon.com',

    // ============================================
    // MUSIQUE & STREAMING AUDIO (40+)
    // ============================================
    'spotify.com',
    'music.spotify.com',
    'soundcloud.com',
    'deezer.com',
    'youtube-music.com',
    'music.youtube.com',
    'applemusic.com',
    'music.apple.com',
    'amazon-music.com',
    'music.amazon.com',
    'bandcamp.com',
    'tidal.com',
    'groove.microsoft.com',
    'music.microsoft.com',
    'lastfm.com',
    'last.fm',
    'pandora.com',
    'iheartradio.com',
    'iheart.com',
    'tunein.com',
    'mixcloud.com',
    'reverbnation.com',
    'napster.com',
    '8tracks.com',
    'jango.com',
    'slacker.com',
    'rdio.com',
    'mog.com',
    'thumbplay.com',
    'rhapsody.com',
    'winamp.com',
    'musicbox.com',
    'music.baidu.com',
    'music.netease.com',
    'qq-music.com',
    'kugou.com',
    'kuwo.cn',
    'xiami.com',
    'bilibili.com',
    'niconico.jp',
    'soundgasm.net',
    'hearthis.at',

    // ============================================
    // STREAMING VIDÉO (50+)
    // ============================================
    'netflix.com',
    'hulu.com',
    'disneyplus.com',
    'primevideo.com',
    'hbo.com',
    'hbomax.com',
    'max.com',
    'paramount.com',
    'paramountplus.com',
    'peacocktv.com',
    'discovery.com',
    'discoveryplus.com',
    'showtime.com',
    'starz.com',
    'crunchyroll.com',
    'funimation.com',
    'vrv.co',
    'mubi.com',
    'criterion.com',
    'shudder.com',
    'sundancenow.com',
    'filmstruck.com',
    'amc.com',
    'britbox.com',
    'acorn.tv',
    'historyhit.com',
    'docsville.com',
    'beamazcontent.com',
    'apple-tv-plus.com',
    'tv.apple.com',
    'googletv.com',
    'roku.com',
    'plex.tv',
    'tubi.tv',
    'pluto.tv',
    'freevee.com',
    'imdb.com',
    'imdb-tv.com',
    'youtube.com',
    'youtu.be',
    'dailymotion.com',
    'vimeo.com',
    'twitch.tv',
    'mixer.com',
    'kick.com',
    'dlive.tv',
    'rumble.com',
    'odysee.com',
    'facebook-watch.com',
    'watch.facebook.com',
    'bilibili.com',
    'iqiyi.com',
    'youku.com',
    'tudou.com',
    'sohu.com',

    // ============================================
    // JEUX VIDÉO & GAMING (60+)
    // ============================================
    'steam.com',
    'steampowered.com',
    'epicgames.com',
    'ea.com',
    'origin.com',
    'uplay.com',
    'ubisoft.com',
    'activisionblizzard.com',
    'blizzard.com',
    'battle.net',
    'playstation.com',
    'xbox.com',
    'nintendo.com',
    'roblox.com',
    'minecraft.net',
    'fortnite.com',
    'pubg.com',
    'leagueoflegends.com',
    'dota2.com',
    'valorant.com',
    'csgo.com',
    'overwatch.com',
    'worldofwarcraft.com',
    'elderscrollsonline.com',
    'finalfantasyxiv.com',
    'guildwars2.com',
    'eve-online.com',
    'ffxiv.com',
    'darksouls.com',
    'elden-ring.com',
    'reddit.com/r/gaming',
    'twitch.tv',
    'youtube.com/gaming',
    'miniclip.com',
    'pogo.com',
    'addictinggames.com',
    'kongregate.com',
    'armor-games.com',
    'newgrounds.com',
    'flashpoint.bluemaxima.org',
    'itch.io',
    'gamejolt.com',
    'gog.com',
    'humble.com',
    'discord.com',
    'reddit.com/r/gaming',
    'discord.gg/gaming',
    'twitch.tv',
    'youtube.com',
    'facebook.com/gaming',
    'mixer.com',
    'facebook-gaming.com',
    'games.facebook.com',
    'gamespot.com',
    'ign.com',
    'polygon.com',
    'kotaku.com',
    'destructoid.com',
    'pcgamer.com',
    'eurogamer.net',

    // ============================================
    // RENCONTRES & DATING (45+)
    // ============================================
    'tinder.com',
    'bumble.com',
    'badoo.com',
    'meetic.com',
    'match.com',
    'plenty-of-fish.com',
    'pof.com',
    'eharmony.com',
    'okcupid.com',
    'ok-cupid.com',
    'zoosk.com',
    'happn.com',
    'hinge.co',
    'theclub.com',
    'grindr.com',
    'scruff.com',
    'jackd.com',
    'growlr.com',
    'lesbian.com',
    'her.com',
    'wapo.com',
    'feeld.co',
    'sofi.dating',
    'loveisland.tv',
    'jiayuan.com',
    'baihe.com',
    'momo.com',
    'tantan.com',
    'blued.com',
    'qiushibaike.com',
    'hookup.com',
    'adult-friend-finder.com',
    'befun.com',
    'quickflirt.com',
    'milfsforless.com',
    'waplog.com',
    'loveme.com',
    'anastasiadate.com',
    'ukrainiancharming.com',
    'mamba.ru',
    'be2.com',
    'cupidmedia.com',
    'worldsinglenetwork.com',
    'singlesnet.com',

    // ============================================
    // CONTENU ADULTE (80+)
    // ============================================
    'pornhub.com',
    'xvideos.com',
    'xnxx.com',
    'redtube.com',
    'youporn.com',
    'pornhd.com',
    'xtube.com',
    'tube8.com',
    'thumbzilla.com',
    'moviesand.com',
    'spankbang.com',
    'hclips.com',
    'trannytube.com',
    'tnaflix.com',
    'hardsextube.com',
    'gayporno.tv',
    'beeg.com',
    'eporner.com',
    'slutload.com',
    'adultfriendfinder.com',
    'xhamster.com',
    'cam4.com',
    'chaturbate.com',
    'myfreecams.com',
    'flirt4free.com',
    'jerkmate.com',
    'xmodels.com',
    'livejasmine.com',
    'cunt.com',
    'sluts.com',
    'xxx.com',
    'sex.com',
    'nude.com',
    'naked.com',
    'adult.com',
    'webcam.com',
    'cam.com',
    'webcams.com',
    'livejasmine.com',
    'boys.cam',
    'girls.cam',
    'gay-porn.com',
    'lesbian-sex.com',
    'matureadult.com',
    'old-and-young.com',
    'incest-porn.com',
    'family-porn.com',
    'rape-porn.com',
    'violence-porn.com',
    'extreme-porn.com',
    'hardcore-porn.com',
    'bdsm-porn.com',
    'bondage-porn.com',
    'domination-porn.com',
    'humiliation-porn.com',
    'fetish-porn.com',
    'bestiality-porn.com',
    'zoophilia-porn.com',
    'scat-porn.com',
    'watersport-porn.com',
    'underage-porn.com',
    'loli-porn.com',
    'hentai-porn.com',
    'anime-porn.com',
    'cartoon-porn.com',
    'drawn-porn.com',
    'sex-shop.com',
    'dildo.com',
    'vibrator.com',
    'nude-celebs.com',
    'celebrity-nudes.com',
    'leaked-nudes.com',
    'revenge-porn.com',
    'onlyfans.com',
    'patreon.com/nsfw',

    // ============================================
    // JEUX D'ARGENT (40+)
    // ============================================
    'bet365.com',
    'betfair.com',
    'bwin.com',
    'williamhill.com',
    'ladbrokes.com',
    'paddypower.com',
    'betvictor.com',
    'skybet.com',
    'betway.com',
    'babiplay.com',
    '888poker.com',
    'partypoker.com',
    'pokerstars.com',
    'fulltilt.com',
    'fulltiltpoker.com',
    'winamax.com',
    'unibet.com',
    '888casino.com',
    'playtech.com',
    'netent.com',
    'microgaming.com',
    'casinoroom.com',
    'royalvegascasino.com',
    'luckycasino.com',
    'gday-casino.com',
    'bodog.com',
    'intertops.com',
    'betdsi.com',
    'betonline.ag',
    'mybookie.ag',
    'sportsbetting.ag',
    'slots-lv.com',
    'bovada.lv',
    'cloudbet.com',
    'smarkets.com',
    'betdaq.com',
    'matchbook.com',
    'betexplorer.com',
    'oddschecker.com',
    'bookiesodds.com',

    // ============================================
    // ALCOOL & DROGUES (35+)
    // ============================================
    'budlight.com',
    'corona.com',
    'heineken.com',
    'guinness.com',
    'absolut.com',
    'smirnoff.com',
    'jackdaniels.com',
    'johnniewalker.com',
    'bacardi.com',
    'captain-morgan.com',
    'redLabel.com',
    'budweiser.com',
    'molsoncanadian.com',
    'cannedwine.com',
    'beerandwine.com',
    'winejunkie.com',
    'beerjunkie.com',
    'thebar.com',
    'liquor.com',
    'adultbeverages.com',
    'thirstyghost.com',
    'mixology.com',
    'cocktails.com',
    'drinksmixer.com',
    '420-site.com',
    'marijuana.com',
    'cannabis.com',
    'weedmaps.com',
    'leafly.com',
    'herb.co',
    'thcdetective.com',
    'smokesmart.com',
    'hightime.com',
    'potguide.com',
    'cannabisdna.com',

    // ============================================
    // TORRENTS & PIRATAGE (30+)
    // ============================================
    'thepiratebay.org',
    'piratebay.live',
    '1337x.to',
    'torrentking.info',
    'rarbg.to',
    'rarbgmirror.com',
    'kickasstorrents.to',
    'kat.am',
    'legittorrents.info',
    'limetorrents.cc',
    'torrentfunk.com',
    'torrentdownloads.info',
    'torrentproject.se',
    'yts.mx',
    'yify-torrent.com',
    'eztv.io',
    'torrentocean.com',
    'torrentdose.com',
    'torrentcrazy.com',
    'torrentmovies.net',
    'torrentsexy.com',
    'torrenting.com',
    'torrentking.info',
    'torrentyfy.com',
    'torrentz2.eu',
    'torrentz2k.com',
    'zooqle.com',
    'magnetdl.com',
    'torzoon.com',
    'extratorrent.cc',

    // ============================================
    // PARTAGE DE CONTENU INAPPROPRIÉ (25+)
    // ============================================
    'imgur.com',
    '9gag.com',
    'ifunny.co',
    '4chan.org',
    '8kun.top',
    '8ch.net',
    'reddit.com/r/nsfw',
    'reddit.com/r/gore',
    'reddit.com/r/violence',
    'reddit.com/r/drugs',
    'reddit.com/r/trees',
    'tumblr.com',
    'twitter.com/search',
    'pinterest.com/nsfw',
    'flickr.com/adult',
    'fotolia.com',
    'istockphoto.com',
    'gettyimages.com',
    'shutterstock.com',
    'alamy.com',
    'depositphotos.com',
    '123rf.com',
    'dreamstime.com',
    'pond5.com',
    'videocopilot.net',

    // ============================================
    // VPN & PROXY (20+)
    // ============================================
    'expressvpn.com',
    'nordvpn.com',
    'surfshark.com',
    'cyberghostvpn.com',
    'ipvanish.com',
    'hotspotshield.com',
    'privateinternetaccess.com',
    'mullvadvpn.net',
    'protonvpn.com',
    'windscribe.com',
    'ivacy.com',
    'hide.me',
    'hideme.ru',
    'hide-my-ip.com',
    'torproject.org',
    'tor-project.org',
    'onion.city',
    '3g2upl4pq6kufc4m.onion',
    'proxy.com',
    'proxylist.to',
    'freeproxylists.net',

    // ============================================
    // CONTENU VIOLENT & EXTRÉMISTE (30+)
    // ============================================
    'bestgore.com',
    'liveleak.com',
    'ogrish.com',
    'rotten.com',
    'monsterdope.com',
    'theync.com',
    'crazyvideos.com',
    'goregrish.com',
    'shockgore.com',
    'extremegore.com',
    'goregasm.com',
    'fucked-up.com',
    'deathaddict.com',
    'sickest-twisted.com',
    'rekt.tv',
    'worldstarhiphop.com/violence',
    'reddit.com/r/watchpeopledie',
    'reddit.com/r/gore',
    'encyclopedia-dramatica.online',
    'kiwifarms.net',
    '4plebs.org',
    'boards.4chan.org/b',
    ' /r/CringeAnarchy',
    'greatawakening.win',
    't.me/extremism',
    '8kun.top/violence',

    // ============================================
    // CONTENU RELIGIEUX NÉGATIF (20+)
    // ============================================
    'atheists.net',
    'atheismplusplus.com',
    'faithfreedom.com',
    'ex-muslim.org.uk',
    'apostasyforum.com',
    'leavingreligion.com',
    'nocreationno.com',
    'xtianity.net',
    'antiislam.com',
    'thereligionofpeace.com',
    'jihadwatch.org',
    'frontpagemag.com',
    'memritv.org/video',
    'investigativeproject.org',
    'clarionproject.org',
    'faithtodoubt.com',
    'beyondbelief-network.org',
    'patheos.com/atheism',
    'infidels.org',
    'brights.net',

    // ============================================
    // MODE & BEAUTÉ INAPPROPRIÉE (25+)
    // ============================================
    'victorias-secret.com',
    'aerie.com',
    'fredperry.com',
    'hollister.com',
    'abercrombie.com',
    'asos.com/nude',
    'fashion-nova.com',
    'prettylittlething.com',
    'boohoo.com',
    'missguided.com',
    'prettylittlething.com',
    'shein.com/lingerie',
    'romwe.com',
    'zaful.com',
    'sexycostumestore.com',
    'fredericks-of-hollywood.com',
    'honeysexshop.com',
    'adultplaythings.com',
    'extremerestraints.com',
    'bdsm-fetish.com',
    'costumelover.com',
    'clotheswap.com',
    'fashionporn.com',

    // ============================================
    // SITES DE STREAMING ILLÉGAL (15+)
    // ============================================
    'solarmovie.so',
    'yesmovies.to',
    '123movies.cc',
    'flixtor.to',
    '0123movies.com',
    'putlocker.vip',
    'moviespur.com',
    'gomovies.to',
    'watchmoviesfree.to',
    'movies777.com',
    'stream-watch.to',
    'lookmovie.io',
    'filmsseriesks.net',
    'watchflix.to',
    'watchtvseries.com',

    // ============================================
    // SHOPPING LUXE & EXCÈS (15+)
    // ============================================
    'gucci.com',
    'louisvuitton.com',
    'chanel.com',
    'hermes.com',
    'versace.com',
    'fendi.com',
    'dior.com',
    'prada.com',
    'burberry.com',
    'balmain.com',
    'valentino.com',
    'dolceandgabbana.com',
    'balenciaga.com',
    'alain-prost.com',
    'superyachts.com',

    // ============================================
    // SITES CHATTING & RENCONTRE INAPPROPRIÉE (15+)
    // ============================================
    'chatroulette.com',
    'omegle.com',
    'azar.page',
    'monkey.co',
    'monkeyapp.com',
    'tinychat.com',
    'shagle.com',
    'stranger.com',
    'bazoocam.com',
    'camsurf.com',
    'videochat.com',
    'webcam-chat.com',
    'camslive.tv',
    'cams.com',
    'liveadultchat.com',
    // ============================================
    // RÉSEAUX SOCIAUX FRANÇAIS (30+)
    // ============================================
    'facebook.com',
    'fb.com',
    'instagram.com',
    'tiktok.com',
    'snapchat.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'pinterest.com',
    'reddit.com',
    'tumblr.com',
    'discord.com',
    'telegram.org',
    'viber.com',
    'nextdoor.com',
    'meetup.com',
    'quora.com',
    'medium.com',
    'wattpad.com',
    'amino.com',
    'flickr.com',
    'patreon.com',
    'twitch.tv',
    'youtube.com',
    'youtu.be',
    'dailymotion.com',
    'vimeo.com',
    'viméo.com',
    'kickstarter.com',
    'indiegogo.com',

    // ============================================
    // STREAMING FRANÇAIS (40+)
    // ============================================
    'netflix.com',
    'netflix.fr',
    'primevideo.com',
    'prime-video.fr',
    'disneyplus.com',
    'disneyplus.fr',
    'canalplus.com',
    'mycanal.fr',
    'hulu.com',
    'crunchyroll.com',
    'crunchyroll.fr',
    'france.tv',
    'francetv.fr',
    'france-televisions.fr',
    'tf1.fr',
    'tf1plus.fr',
    'france2.fr',
    'france3.fr',
    'france5.fr',
    'france-o.fr',
    'arte.tv',
    'artefr.tv',
    'm6.fr',
    '6play.fr',
    'c8.fr',
    'w9.fr',
    'tmc.tv',
    'teletoon.fr',
    'gulli.fr',
    'eurosport.fr',
    'eurosport-play.fr',
    'ocs.fr',
    'molotov.tv',
    'plex.tv',
    'tubi.tv',
    'pluto.tv',
    'cine.plus',
    'cinemax.fr',
    'ocs-cine.fr',

    // ============================================
    // MUSIQUE FRANÇAISE (35+)
    // ============================================
    'spotify.com',
    'spotify.fr',
    'deezer.com',
    'deezer.fr',
    'apple-music.com',
    'music.apple.com',
    'amazon-music.com',
    'music.amazon.fr',
    'youtube-music.com',
    'music.youtube.com',
    'youtube.com/music',
    'soundcloud.com',
    'bandcamp.com',
    'tidal.com',
    'tidal.fr',
    'genius.com',
    'lyrics.com',
    'paroles.net',
    'lyrics-translations.com',
    'chordify.net',
    'tunein.com',
    'iheartradio.com',
    'pandora.com',
    'lastfm.com',
    'last.fm',
    'rateyourmusic.com',
    'musicbrainz.org',
    'discogs.com',
    'allmusic.com',
    'stereogum.com',
    'pitchfork.com',
    'resident-advisor.com',
    'musicradar.com',
    'thejuno.com',
    'beatport.com',

    // ============================================
    // JEUX VIDÉO FRANÇAIS (40+)
    // ============================================
    'steam.com',
    'steampowered.com',
    'epicgames.com',
    'epicgames.fr',
    'ubisoft.com',
    'ubisoft.fr',
    'uplay.com',
    'uplay.fr',
    'activisionblizzard.com',
    'blizzard.com',
    'blizzard.fr',
    'battle.net',
    'playstation.com',
    'playstation.fr',
    'psn.com',
    'xbox.com',
    'xbox.fr',
    'nintendo.com',
    'nintendo.fr',
    'roblox.com',
    'roblox.fr',
    'minecraft.net',
    'minecraft.fr',
    'fortnite.com',
    'fortnite.fr',
    'valorant.com',
    'leagueoflegends.com',
    'leagueoflegends.fr',
    'dota2.com',
    'csgo.com',
    'pubg.com',
    'itch.io',
    'itch.fr',
    'gamejolt.com',
    'gog.com',
    'humble.com',
    'gamespot.com',
    'ign.com',
    'ign.fr',
    'jeuxvideo.com',
    'gamekult.com',
    'canardpc.com',

    // ============================================
    // DATING & RENCONTRES FRANÇAIS (35+)
    // ============================================
    'tinder.com',
    'tinder.fr',
    'bumble.com',
    'bumble.fr',
    'badoo.com',
    'badoo.fr',
    'meetic.com',
    'meetic.fr',
    'match.com',
    'match.fr',
    'okcupid.com',
    'ok-cupid.fr',
    'eharmony.com',
    'eharmony.fr',
    'plentyoffish.com',
    'pof.com',
    'zoosk.com',
    'zoosk.fr',
    'happn.com',
    'happn.fr',
    'hinge.co',
    'the-league.com',
    'the-inner-circle.com',
    'raya.app',
    'luxy.com',
    'elite-singles.com',
    'be2.com',
    'be2.fr',
    'be2dating.com',
    'adorable.com',
    'amouraveugle.com',
    'amoureco.com',
    'amour-prive.com',
    'rencontre.com',
    'rencontre-sérieuse.com',
    'rencontres.com',

    // ============================================
    // CONTENU ADULTE FRANÇAIS (60+)
    // ============================================
    'pornhub.com',
    'xvideos.com',
    'xnxx.com',
    'redtube.com',
    'youporn.com',
    'tube8.com',
    'xhamster.com',
    'cam4.com',
    'chaturbate.com',
    'myfreecams.com',
    'jerkmate.com',
    'flirt4free.com',
    'xmodels.com',
    'livejasmine.com',
    'cunt.com',
    'sluts.com',
    'xxx.com',
    'sex.com',
    'nude.com',
    'naked.com',
    'adult.com',
    'webcam.com',
    'cam.com',
    'cams.com',
    'webcams.com',
    'eporner.com',
    'spankbang.com',
    'hclips.com',
    'porno.com',
    'porno.fr',
    'pornographie.com',
    'pornoflix.com',
    'pornoblog.com',
    'sexe.com',
    'sexes.com',
    'sexy.com',
    'sexyvideos.com',
    'adultfriendfinder.com',
    'adult-friend-finder.fr',
    'affinity.com',
    'libertin.com',
    'libertin.fr',
    'echangiste.com',
    'echangistes.fr',
    'libertins.org',
    'nudesite.com',
    'nude.fr',
    'nudesex.com',
    'sexyvideo.fr',
    'videosex.fr',
    'webcamsex.fr',
    'cam-sex.fr',
    'camsex.fr',
    'livecam.fr',
    'liveshow.fr',
    'onlyfans.com',
    'onlyfans.fr',
    'patreon.com',
    'fansly.com',
    'instaflix.tv',
    'mrdeepfakes.com',
    'deepfake.com',

    // ============================================
    // JEUX D'ARGENT FRANÇAIS (35+)
    // ============================================
    'fdj.fr',
    'loto.fr',
    'loto-esport.fr',
    'lottery.fr',
    'parionssport.fr',
    'parionssport-enligne.fr',
    'pmu.fr',
    'pmu-enligne.fr',
    'pmu-poker.fr',
    'hippodrome.fr',
    'unibet.fr',
    'unibet.com',
    'bet365.com',
    'bet365.fr',
    'betfair.com',
    'betfair.fr',
    'bwin.fr',
    'bwin.com',
    'williamhill.com',
    'williamhill.fr',
    'ladbrokes.fr',
    'paddypower.com',
    'skybet.com',
    'betvictor.com',
    'betway.com',
    'betway.fr',
    'betclic.fr',
    'zebet.fr',
    '888poker.fr',
    'pokerstars.fr',
    'winamax.fr',
    'winamax.com',
    'betfair-poker.fr',
    'everest-poker.com',
    'ipoker.fr',
    'casinobetting.fr',

    // ============================================
    // ALCOOL & DROGUES FRANÇAIS (30+)
    // ============================================
    'heineken.fr',
    'corona.fr',
    'biere.com',
    'biere.fr',
    'beerpedia.com',
    'alsacienne.com',
    'paulaner.fr',
    'guinness.fr',
    'budweiser.fr',
    'kronenbourg.fr',
    'absolut.fr',
    'smirnoff.fr',
    'bacardi.fr',
    'rum.fr',
    'rhum.fr',
    'cognac.fr',
    'armagnac.fr',
    'calvados.fr',
    'pastis.fr',
    'ricard.fr',
    'pernod.fr',
    'absinthe.fr',
    'whisky.fr',
    'wine.fr',
    'vino.fr',
    'vin.fr',
    'winelovers.fr',
    'vinorama.com',
    '420-site.com',
    'cannabis.fr',
    'marijuana.fr',
    'weed.fr',
    'ganja.fr',
    'hemp.fr',
    'cbd.fr',

    // ============================================
    // TORRENTS & PIRATAGE FRANÇAIS (25+)
    // ============================================
    'thepiratebay.org',
    '1337x.to',
    'rarbg.to',
    'kickasstorrents.to',
    'torrentfreak.com',
    'torrentking.info',
    'limetorrents.cc',
    'torrentproject.se',
    'yts.mx',
    'eztv.io',
    'torrentocean.com',
    'torrentdose.com',
    'torrentdownloads.info',
    'torrentfunk.com',
    'torrentmovies.net',
    'torrentsexy.com',
    'torrentz2.eu',
    'zooqle.com',
    'magnetdl.com',
    'extratorrent.cc',
    'torrentiphone.com',
    'torrent.fr',
    'torrentfr.info',
    'torrents-fr.com',
    'telecharger-films.fr',

    // ============================================
    // CONTENU INAPPROPRIÉ FRANÇAIS (30+)
    // ============================================
    'reddit.com/r/france',
    'reddit.com/r/sexe',
    'reddit.com/r/france-gw',
    '4chan.org',
    '8kun.top',
    'kiwifarms.net',
    'encyclopedia-dramatica.online',
    'bestgore.com',
    'liveleak.com',
    'rotten.com',
    'monsterdope.com',
    'worldstarhiphop.com',
    'crazyvideos.com',
    'goregrish.com',
    'deathaddict.com',
    'sickest-twisted.com',
    'rekt.tv',
    '9gag.com',
    'imgur.com',
    'ifunny.co',
    'tumblr.com',
    'twitter.com/search',
    'pinterest.com',
    'flickr.com',
    'deviantart.com',
    'pixiv.net',
    'hentai-foundry.com',
    'newgrounds.com',
    'itch.io',
    'furaffinity.net',

    // ============================================
    // VPN & PROXY FRANÇAIS (15+)
    // ============================================
    'expressvpn.com',
    'nordvpn.com',
    'nordvpn.fr',
    'surfshark.com',
    'surfshark.fr',
    'cyberghostvpn.com',
    'ipvanish.com',
    'hotspotshield.com',
    'privateinternetaccess.com',
    'mullvadvpn.net',
    'protonvpn.com',
    'windscribe.com',
    'hide.me',
    'torproject.org',
    'proxy.com',

    // ============================================
    // CONTENU RELIGIEUX NÉGATIF FRANÇAIS (20+)
    // ============================================
    'apostasieislam.com',
    'apostasieislam.fr',
    'faithfreedom.com',
    'ex-muslim.org.uk',
    'atheismplusplus.com',
    'thereligionofpeace.com',
    'jihadwatch.org',
    'investigativeproject.org',
    'clarionproject.org',
    'infidels.org',
    'brights.net',
    'rationalist.org.uk',
    'humanrights.fr',
    'secularism.org.uk',
    'ffrf.org',
    'centralatheisme.fr',
    'radicelle.net',
    'sceptiques.qc.ca',
    'observatoireislam.org',
    'cncdh.org',

    // ============================================
    // SHOPPING FRANÇAIS (25+)
    // ============================================
    'amazon.fr',
    'ebay.fr',
    'alibaba.com',
    'aliexpress.com',
    'wish.com',
    'shein.com',
    'asos.com',
    'asos.fr',
    'zara.com',
    'zara.fr',
    'h-m.com',
    'hm.com',
    'hm.fr',
    'uniqlo.com',
    'uniqlo.fr',
    'forever21.com',
    'forever21.fr',
    'prettylittlething.com',
    'boohoo.com',
    'missguided.com',
    'fashionnova.com',
    'romwe.com',
    'zaful.com',
    'zaful.fr',
    'shein.fr',
    'gucci.com',

    // ============================================
    // SITES DE CHAT & RENCONTRE INAPPROPRIÉE (20+)
    // ============================================
    'chatroulette.com',
    'chatroulette.fr',
    'omegle.com',
    'omegle.fr',
    'azar.page',
    'monkey.co',
    'tinychat.com',
    'shagle.com',
    'camsurf.com',
    'videochat.com',
    'webcam-chat.com',
    'camslive.tv',
    'liveadultchat.com',
    'chatgratis.net',
    'chatsxxx.com',
    'xat.com',
    'meetic-chat.fr',
    'chat-dating.fr',
    'chattadom.com',
    'coco.fr',

    // ============================================
    // STREAMING ILLÉGAL FRANÇAIS (15+)
    // ============================================
    'solarmovie.so',
    'yesmovies.to',
    '123movies.cc',
    'flixtor.to',
    'putlocker.vip',
    'gomovies.to',
    'watchmoviesfree.to',
    'movies777.com',
    'lookmovie.io',
    'watchtvseries.com',
    'telecharger-films.fr',
    'films-gratuits.fr',
    'streamingvf.fr',
    'film-streaming.fr',
    'films-vf.fr',

    // ============================================
    // FORUMS & COMMUNAUTÉS INAPPROPRIÉES (20+)
    // ============================================
    'jeuxvideo.com/forums',
    'freeforumzone.com',
    'forum-actif.com',
    'forumactif.fr',
    'xooit.fr',
    'forumez.com',
    'zaboard.com',
    'mon-forum.com',
    'forumms.com',
    'forumserveur.com',
    'forsup.com',
    'forumbz.com',
    'forumotion.com',
    'forumz.net',
    'guppy.fr',
    'libertins.org',
    'echangiste.fr',
    'cuckold.fr',
    'candault.fr',
    'libertin.fr',

    // ============================================
    // NEWS & INFOS SENSIBLES (15+)
    // ============================================
    'breitbart.com',
    'infowars.com',
    'ruptly.tv',
    'rt.com',
    'sputnikfr.com',
    'pressenza.com',
    'lecanardenchainé.fr',
    'marianne.net',
    'valeurs-actuelles.com',
    'front-national.org',
    'bnp-paribas-scandal.com',
    'investigation-france.fr',
    'mediapart.fr',
    'rue89.com',
    'mediapart-investigation.fr',

    // ============================================
    // APPLICATIONS MOBILES (10+)
    // ============================================
    'tiktok.com',
    'snapchat.com',
    'instagram.com',
    'discord.com',
    'telegram.org',
    'whatsapp.com',
    'signal.org',
    'threema.ch',
    'wickr.com',
    'kik.com',

    // ============================================
    // STREAMING AUDIO FRANÇAIS (10+)
    // ============================================
    'radiofrance.fr',
    'radiofrance-podcasts.fr',
    'francebleu.fr',
    'franceinter.fr',
    'franceculture.fr',
    'mouv.fr',
    'virginradio.fr',
    'nrj.fr',
    'rtl.fr',
    'bfmradio.com',
  ];

  allBlocked.push(...additional);

  // Retire les doublons
  return [...new Set(allBlocked)];
}

/**
 * Vérifie si un domaine correspond à un pattern (wildcards)
 */
export function matchesDomain(url, pattern) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Pattern exact
    if (pattern === hostname) {
      return true;
    }

    // Wildcard au début: *.example.com
    if (pattern.startsWith('*.')) {
      const domain = pattern.substring(2);
      return hostname === domain || hostname.endsWith('.' + domain);
    }

    // Wildcard à la fin: example.*
    if (pattern.endsWith('.*')) {
      const domain = pattern.substring(0, pattern.length - 2);
      return hostname.startsWith(domain);
    }

    // Wildcard au milieu: *.example.*
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp('^' + regexPattern + '$', 'i');
      return regex.test(hostname);
    }

    // Sous-domaine inclus
    return hostname.endsWith('.' + pattern);
  } catch (error) {
    return false;
  }
}

/**
 * Vérifie si une URL contient des mots-clés suspects
 */
// NOUVEAU CODE - Correspondance de mots entiers uniquement
export function containsSuspiciousKeywords(url, keywords) {
  const urlLower = url.toLowerCase();

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Échappe les caractères spéciaux pour regex
    const escapedKeyword = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Regex avec délimiteurs de mots (\b) pour correspondance exacte
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
    
    if (regex.test(urlLower)) {
      return { blocked: true, keyword };
    }
  }

  return { blocked: false };
}


/**
 * Récupère tous les domaines d'une catégorie
 */
export function getCategoryDomains(categoryKey) {
  return CATEGORIES[categoryKey]?.domains || [];
}

/**
 * Récupère toutes les catégories activées
 */
export function getActiveCategories(config) {
  const active = [];

  if (config.blockSocialMedia) active.push(...CATEGORIES.socialMedia.domains);
  if (config.blockMusicStreaming) active.push(...CATEGORIES.musicStreaming.domains);
  if (config.blockVideoStreaming) active.push(...CATEGORIES.videoStreaming.domains);
  if (config.blockDating) active.push(...CATEGORIES.dating.domains);
  if (config.blockGaming) active.push(...CATEGORIES.gaming.domains);
  if (config.blockAdult) active.push(...CATEGORIES.adult.domains);
  if (config.blockReddit) active.push(...CATEGORIES.reddit.domains);

  return [...new Set(active)];
}

/**
 * Vérifie si un site est dans la whitelist
 */
export function isWhitelisted(url, whitelist) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Vérifie la whitelist personnalisée
    for (const site of whitelist) {
      if (matchesDomain(url, site)) {
        return true;
      }
    }

    // Vérifie les sites islamiques (toujours autorisés)
    for (const site of ISLAMIC_SITES) {
      if (hostname.includes(site)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}
