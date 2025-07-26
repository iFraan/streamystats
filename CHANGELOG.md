# Changelog

## [3.0.0](https://github.com/iFraan/streamystats/compare/v2.4.0...v3.0.0) (2025-07-26)


### ⚠ BREAKING CHANGES

* This is a major version upgrade with breaking changes requiring migration from v1.x to v2.x including database schema changes, new compose file and new Docker images

### Features

* active sessions ([a6d95c3](https://github.com/iFraan/streamystats/commit/a6d95c3c328eea12b1ed33fdc9118cc843b449b0))
* activity log ([9904dd2](https://github.com/iFraan/streamystats/commit/9904dd2f5dc303612cd3669b6e7a205f042f1a29))
* add average watch time and longest streak columns to UserTable with sorting functionality ([52bec4c](https://github.com/iFraan/streamystats/commit/52bec4c96cf31aa76590d4f609f39297fb574cec))
* add based on statistic ([1264e4f](https://github.com/iFraan/streamystats/commit/1264e4fdf371bec34e6416dd83b32b66c39fc48a))
* add basePath to next.config.mjs to make components basePath aware ([7137e11](https://github.com/iFraan/streamystats/commit/7137e1108f8622db61592e5d5487e286d22faec4))
* add error boundary to page ([4147dcd](https://github.com/iFraan/streamystats/commit/4147dcdfd2fc0868b60d934ab7be8c59ca1c2ae5))
* add horizontal scroll to similar statistics cards ([e54f907](https://github.com/iFraan/streamystats/commit/e54f90723101a8deaee45c8cee2ea7427f448633))
* add release please ([b40fdaa](https://github.com/iFraan/streamystats/commit/b40fdaad038c4cf296c15cd2f9815b5f87b01362))
* add removed_at field to Item model and implement logic for marking items as removed during sync ([56e91b7](https://github.com/iFraan/streamystats/commit/56e91b76a125303ac1e757df8c88fc4efbb3e2ed))
* add removed_at field to Library model and update synchronization logic to mark libraries as removed ([0be4b08](https://github.com/iFraan/streamystats/commit/0be4b08986092a410ee0cac0b20b9e58f7ccc5a4))
* add size prop to Poster component and implement fallback for missing images ([d6ce62a](https://github.com/iFraan/streamystats/commit/d6ce62ae97d0e38e6349603f0434bb38fe4df3a6))
* add User Activity chart with date filtering - Add horizontal bar chart showing daily active users - Implement user activity statistics in Phoenix backend - Add new API endpoint for user activity data - Create date filtering with calendar component - Add client-side data fetching via API route - Chart displays unique users per day from playback_sessions - Include date range controls with preset options - Fix tooltip spacing and layout issues ([0874dc5](https://github.com/iFraan/streamystats/commit/0874dc5d2c438f036491d086dbe5ca9dcff98dba))
* add utility function to format time since last activity in ActiveSessions component ([59695d2](https://github.com/iFraan/streamystats/commit/59695d2b785e91be432d02948de9cd571c2fbc98))
* added item watch statistics ([165259c](https://github.com/iFraan/streamystats/commit/165259c492e54984bf2fba566a01d636a4f4fbc5))
* aggregate episode stats for series ([22c55d9](https://github.com/iFraan/streamystats/commit/22c55d94aa1f8fdca203afcf64d6c595735fe971))
* arm build ([7f2bd5e](https://github.com/iFraan/streamystats/commit/7f2bd5ec8941078266acce564d6db9092d70ca44))
* build manual version tag ([bdf6685](https://github.com/iFraan/streamystats/commit/bdf66851ade6ea80e75b2a00933da60fc9e9a37e))
* build PR images ([49f1bbe](https://github.com/iFraan/streamystats/commit/49f1bbeb65f8ef869c033e5da58bd9a6a38e66b2))
* details page ([de987e9](https://github.com/iFraan/streamystats/commit/de987e9282858f799a1d245cdddd12a43b851d25))
* enhance active sessions with detailed bitrate and transcoding info ([9cb525d](https://github.com/iFraan/streamystats/commit/9cb525dcaa4fc938076111a87613b076fcb5c5a6))
* enhance ActiveSessions component with improved layout, additional session details, and IP address display ([157ab07](https://github.com/iFraan/streamystats/commit/157ab07f0c38a24cd9aa380a28bf3b21ca097b08))
* enhance ActiveSessions component with playback method badge and update session mapping for transcoding info ([0ce49fa](https://github.com/iFraan/streamystats/commit/0ce49fa3aa33f41f92d7b32f6e71d410d61758f2))
* enhance dashboard cards to display percentage labels and improve responsiveness for better data visualization ([ea2311d](https://github.com/iFraan/streamystats/commit/ea2311dcb436dfcab6ff59fb44063059f37c90ea))
* enhance dashboard cards with custom labels and filter out zero counts for better data representation ([c2ed475](https://github.com/iFraan/streamystats/commit/c2ed47544c7f3359539db5c5d3a6be90fe17864b))
* enhance ItemWatchStatsTable with improved sorting, additional item details, and responsive layout adjustments ([0cd9a31](https://github.com/iFraan/streamystats/commit/0cd9a3176786ffab5894e1a28a19710bffd9c0df))
* enhance library queries by integrating active library checks and improving performance ([192dbb9](https://github.com/iFraan/streamystats/commit/192dbb9d86bb17aad3c8cd119ce786f92ee0b6d3))
* enhance SQLite configuration for adaptive caching and memory storage based on system resources during playback session export ([9990724](https://github.com/iFraan/streamystats/commit/9990724647ed427396d47fc0ca828cd972f17ae3))
* enhance user activity tables with links to user profiles and improve chart responsiveness ([89e943c](https://github.com/iFraan/streamystats/commit/89e943c6c24de52a5a453c3b8b94f413b7971323))
* enhance user interface with improved hover effects and link functionality across activity and user tables ([9df24e1](https://github.com/iFraan/streamystats/commit/9df24e1271b96627ea399160e5a8b602a726b1a5))
* enhance user interface with JellyfinAvatar component and improve session display ([df93e51](https://github.com/iFraan/streamystats/commit/df93e519f1e7ccda12295d5f75ccd807d7af8f19))
* filter out non-media types in genre stats ([1fcceb6](https://github.com/iFraan/streamystats/commit/1fcceb6734250ce6948bd7bfd1923281458064a2))
* hide most watch sections ([defd5bd](https://github.com/iFraan/streamystats/commit/defd5bdc6c3888167f89d4f6dcfd366cdc2ca940))
* images ([0480bee](https://github.com/iFraan/streamystats/commit/0480bee9dbf5a616c1ae4b7af33b337d046d35fb))
* import transcoding info when importing from jellystat ([8085ac9](https://github.com/iFraan/streamystats/commit/8085ac913aee9a3a84fd98b7623e67530b46e8b6))
* import/export/backup session data from Streamystats ([63ec9a3](https://github.com/iFraan/streamystats/commit/63ec9a37cb3d0e191da636f07e059b3be7847286))
* improve library and statistics queries by using subqueries for active library checks and adding documentation ([0667c73](https://github.com/iFraan/streamystats/commit/0667c73907a26dc3f3a10bad8f63992106a4f7ea))
* increase transaction timeout for large exports and schedule temporary file deletion after response ([3a7deb0](https://github.com/iFraan/streamystats/commit/3a7deb06ed3b07595526af1b3ea47169f4ef1abc))
* integrate Poster component into HistoryTable and ItemWatchStatsTable for improved item display ([6f696a5](https://github.com/iFraan/streamystats/commit/6f696a5b7e273a76e0a582c1c8d4632963a5d86b))
* item details ([eb2c788](https://github.com/iFraan/streamystats/commit/eb2c788904aa23a3e0cd1c3a93fa54a704285f1c))
* item specific statistics + api endpoint for items ([26d7584](https://github.com/iFraan/streamystats/commit/26d75842821f39c7f3019ff8a82840a12640769e))
* **job-server:** allow setting of listening host ([c98d82a](https://github.com/iFraan/streamystats/commit/c98d82a84e7bbc71566ed2f9f68a7d964ca63c1c))
* library stats ([f1efa1d](https://github.com/iFraan/streamystats/commit/f1efa1da23e6296672d574228cb1339cb0424f26))
* major version 2.0.0 release ([d12e3aa](https://github.com/iFraan/streamystats/commit/d12e3aa5a824dbbbd5e072966f3ac538e54afded))
* make fetch() calls basePath aware ([7e1a1d0](https://github.com/iFraan/streamystats/commit/7e1a1d0235792922991063e693bc41da3b3816e1))
* make middleware aware of basePath ([e6e542d](https://github.com/iFraan/streamystats/commit/e6e542d3cbdc841143a1a2ec2c636250cd51a1d5))
* more stats ([3b3946b](https://github.com/iFraan/streamystats/commit/3b3946b2f8ab64d33cfef854c400cc06ad3fdd83))
* most watched items ([b8a2f31](https://github.com/iFraan/streamystats/commit/b8a2f31a6f726dbf36ef03d508bd95f6d68ee7b6))
* movie/episode split for dashboard stats ([167dc32](https://github.com/iFraan/streamystats/commit/167dc327c7773c59fe0d0cb91bc1186d37bbbae2))
* new docker builder for prs ([1898f4b](https://github.com/iFraan/streamystats/commit/1898f4b27c46d16adbdac122cbf6ef19d93e2599))
* new favicon ([c644990](https://github.com/iFraan/streamystats/commit/c64499008daf2049346a615a7a8d1ae7c7bad734))
* new transcoding statistics ([f08b8d1](https://github.com/iFraan/streamystats/commit/f08b8d1e9431a68a645f31013c49c0cfdb75fab2))
* new transcoding statistics cards ([d28f6ea](https://github.com/iFraan/streamystats/commit/d28f6ea65c227b95d1e98ad08baf8db695dbfe53))
* **nextjs-app:** use next/image for MorphingDialogImage ([dc74fb3](https://github.com/iFraan/streamystats/commit/dc74fb3521aa2a6037c0451fc9bb9f74229856d3))
* ollama support for embedding ([d3ad198](https://github.com/iFraan/streamystats/commit/d3ad198b7d6a20ae96fc3306b6e25458b3d1ea9c))
* personal stats including spider graph for genres ([da8a664](https://github.com/iFraan/streamystats/commit/da8a66411814d0e698f20ddf1db590d8a3d1b45c))
* playback reporting plugin import data ([f72ff9a](https://github.com/iFraan/streamystats/commit/f72ff9a201fc708af30dcbf71714df3f1303dd4a))
* posters ([79e4acc](https://github.com/iFraan/streamystats/commit/79e4acc2ea19724403fa1ebbf698a79471f2e66a))
* pre-work for eventual tautulli import ([7b4c946](https://github.com/iFraan/streamystats/commit/7b4c946f240d25c31714a4e36e44c5276960e0ea))
* provide basePath aware fetch in utils ([09aa4ba](https://github.com/iFraan/streamystats/commit/09aa4ba7cdd1e72f421119117edb086d2fdddd27))
* pwa ([f59f6b5](https://github.com/iFraan/streamystats/commit/f59f6b526693deae1328969500ba01e11fa10a9c))
* remove playback reporting plugin dep and use sessions instead ([dbc43b3](https://github.com/iFraan/streamystats/commit/dbc43b37dba680481eca578c703cb0470606b8f6))
* replace Avatar component with JellyfinAvatar for user display in UserLeaderboardTable ([cd1994b](https://github.com/iFraan/streamystats/commit/cd1994b8b1bc098e51d4aa85f174fb82a019d476))
* set host in compose files ([8236e3f](https://github.com/iFraan/streamystats/commit/8236e3fa51f9a35d2fc2e4287daf8187b1480df7))
* specify libraries included on libraries page ([d63b72c](https://github.com/iFraan/streamystats/commit/d63b72cf9255b90e4f78098e1c46383441090019))
* svg icon ([e369d27](https://github.com/iFraan/streamystats/commit/e369d2737fc4e91ea2dc352d759e0349cbc7191a))
* switch to next/link in SideBar and ServerSelector ([9b10318](https://github.com/iFraan/streamystats/commit/9b103181d8a0448cd78df08be26020c00285ab77))
* total watch time for series in history table ([95bbd3a](https://github.com/iFraan/streamystats/commit/95bbd3a1ca68f1e3f0a0c25692d40715b356eec3))
* update database configuration to use environment variables and enhance .env.example file ([36c0b8c](https://github.com/iFraan/streamystats/commit/36c0b8cc1ab3f578d56a64fadc85dd7ce459cfb5))
* use ScrollArea and ScrollBar for horizontal scrolling in SimilarSeriesStatistics ([9648625](https://github.com/iFraan/streamystats/commit/9648625a78aeefd7adf94b4d702f921c57596bcd))
* user leaderboard on dashboard ([9b4f4cb](https://github.com/iFraan/streamystats/commit/9b4f4cbd993f9908e3b215049116e84a3ee45777)), closes [#52](https://github.com/iFraan/streamystats/issues/52)
* user longest streak ([d3caff0](https://github.com/iFraan/streamystats/commit/d3caff0de2ea1676eaa67e8be82c623097bb7f6d))
* user sync ([9610f2c](https://github.com/iFraan/streamystats/commit/9610f2c4d26ce6887c26271c385f10c9523a2b3b))
* version badge and toast ([f5993bb](https://github.com/iFraan/streamystats/commit/f5993bbf1d32d1ae857fa5853976972aea2753e1))
* watch time per hour ([61c9903](https://github.com/iFraan/streamystats/commit/61c9903c2471ae2a7c6963090d8ec0ac051d7d96))


### Bug Fixes

* add cache control to release fetch ([8410505](https://github.com/iFraan/streamystats/commit/8410505924ad7681f8b4b70cd4df541fb622b371))
* add cache to search items ([256834b](https://github.com/iFraan/streamystats/commit/256834b0616ae6d240b2b0f402db5bdb16211bce))
* add info [skip ci] ([bc80c5b](https://github.com/iFraan/streamystats/commit/bc80c5bd5a8adc699c242aadb529943844641dee))
* add modal confirm with info about duplicate entires ([891d9e7](https://github.com/iFraan/streamystats/commit/891d9e7d52fcdd58f4c190af85700c074a3d990a))
* add parent and index numbers to session mapping ([9440f5c](https://github.com/iFraan/streamystats/commit/9440f5cd093e936cf412ed93eddc723d71fa5856))
* add sha to version badge [skip ci] ([5945318](https://github.com/iFraan/streamystats/commit/5945318ba865823379e63d5fa5f8f857ebf36db9))
* add subtitle ([fb71529](https://github.com/iFraan/streamystats/commit/fb715292b3cd1170288334eea8d0260719694c10))
* add tags verison explain [skip ci] ([23ca635](https://github.com/iFraan/streamystats/commit/23ca635d3daaae755c09b9e9a8f430e5ccb87e54))
* adjust sync start time with a 5-second buffer and improve logging for removed items ([6ecfe39](https://github.com/iFraan/streamystats/commit/6ecfe393dfaa26485a0099d636010963cc60532b))
* alert dialog broke import ([5d23841](https://github.com/iFraan/streamystats/commit/5d23841cb622a90c101d21629bf4700cf7a579e2))
* allow auth header (or cookie) ([56cd123](https://github.com/iFraan/streamystats/commit/56cd1239fce8db921ee4b5edd1a0b9f51aa32958))
* allow label creation ([6502b8c](https://github.com/iFraan/streamystats/commit/6502b8c2804ee63faba19bece19fc3c0964c39c9))
* allow nil name by re-naming to "Untitled Item" ([dc2a8e3](https://github.com/iFraan/streamystats/commit/dc2a8e3c0fa544acf10a227dc2e88cbc4f318c2f))
* arm64 build error ([7be28fc](https://github.com/iFraan/streamystats/commit/7be28fc542c7971a445d7caf1e154e6a5c54c437))
* auto start embedding ([0284f35](https://github.com/iFraan/streamystats/commit/0284f35e349f1490f4d77bc22339b6cbc29385aa))
* avatars in users table ([bcefacb](https://github.com/iFraan/streamystats/commit/bcefacb08472f642952d77532969f62a9615ba0b))
* await params ([2acad96](https://github.com/iFraan/streamystats/commit/2acad96446a91c7197a59b5a3c4e6fcb657c56bd))
* better auth ([af9858c](https://github.com/iFraan/streamystats/commit/af9858cdf1b43549db06bbfd8442d0f60e02e1cb))
* better ci-cd's ([1b71f9b](https://github.com/iFraan/streamystats/commit/1b71f9b404eda2eca360bf6a697be9bd2a90b6dd))
* better filtering ([23ab43b](https://github.com/iFraan/streamystats/commit/23ab43bc6ef59b0ca5984f9e4c36a7b45238cd2a))
* better sync and cleanup ([229be4e](https://github.com/iFraan/streamystats/commit/229be4e607975483baca238db197af0a25503306))
* better user admin check ([afd3d25](https://github.com/iFraan/streamystats/commit/afd3d25f2c9031bbecc8835e6c20ae4392d20dbe))
* breadcrumb casing ([3d56eaf](https://github.com/iFraan/streamystats/commit/3d56eafb526287965add6068611b0e6807e36edb))
* BreadcrumbLink does not handle basePath automatically ([2452709](https://github.com/iFraan/streamystats/commit/2452709ef8795130763e9393cf7bfa46ae071f7b))
* build ([73924c8](https://github.com/iFraan/streamystats/commit/73924c8e6c5107c37aa4b5520458a420a0a56cfd))
* build error ([48f0db3](https://github.com/iFraan/streamystats/commit/48f0db38384a253ac980fd14ca66539552a13d98))
* build error ([9f5d2c5](https://github.com/iFraan/streamystats/commit/9f5d2c5b547b3d4c68d22b713bc7f6be55bac90c))
* build error ([9beb9cb](https://github.com/iFraan/streamystats/commit/9beb9cb70cc43f9327ef25bdaa2fce6c13844c8b))
* build error ([e8d6b5d](https://github.com/iFraan/streamystats/commit/e8d6b5dfc1a3f166e309ecc877293b187dfb5eac))
* build errors ([f18ff49](https://github.com/iFraan/streamystats/commit/f18ff49fa39db871b345af4834b7bda5dd8072ee))
* build folders ([da2a809](https://github.com/iFraan/streamystats/commit/da2a8090819a6d1c6acab17899e68a1b091020d3))
* build folders ([cbb4db2](https://github.com/iFraan/streamystats/commit/cbb4db27fb6f54845d413f865864e3528b8b3ce9))
* build on main push ([67664ac](https://github.com/iFraan/streamystats/commit/67664ac61c0af41f77fd733219dc9553435d4f79))
* change name to library ([03d7089](https://github.com/iFraan/streamystats/commit/03d70894c069cea9ce452713cc741e3ec88c8453))
* **ci:** ensure pnpm is properly installed before use in workflow ([8649f9a](https://github.com/iFraan/streamystats/commit/8649f9a6077389377c693f8625f45b57dfbd90d9))
* clear design for login/setup ([e0e24c0](https://github.com/iFraan/streamystats/commit/e0e24c092c5b31854178d7c4d98cbe5a2252ed9b))
* combine accordion [skip ci] ([95b137f](https://github.com/iFraan/streamystats/commit/95b137f62449c5466f223b121337d25f9dbf735b))
* container listening on all interfaces ([b34cb1b](https://github.com/iFraan/streamystats/commit/b34cb1b9dd1bdc5a8586e595accf05826d48ab67))
* convert all string fields to text to prevent truncation errors ([ebdd46d](https://github.com/iFraan/streamystats/commit/ebdd46d0d675c86a3cbcf383599fd620eafcca9e))
* convert embeddings to proper Pgvector format ([8a76035](https://github.com/iFraan/streamystats/commit/8a76035b7416f741380ee008d23b687c70bb42df))
* correct extension name ([3579dfb](https://github.com/iFraan/streamystats/commit/3579dfb5cd200110b70903d05b93af0c1c10e476))
* correct ids mapping from jellystat ([b55bea9](https://github.com/iFraan/streamystats/commit/b55bea911dfe41cde40551d100804332bc3591b7))
* correct instructions ([61d03c8](https://github.com/iFraan/streamystats/commit/61d03c8caf70d8f050e919a3f71eae2d77f20360))
* correct migration ([75e9b00](https://github.com/iFraan/streamystats/commit/75e9b001bf7a628d02683173b021c180e3091291))
* correct pluralization in 'No items watched yet' message in MostWatchedItems component ([2dbe5c1](https://github.com/iFraan/streamystats/commit/2dbe5c13fe8548964a61623f39c99bba681961af))
* correct typo in SimilarStatistics component name ([9347c4f](https://github.com/iFraan/streamystats/commit/9347c4fa2196738ea3b55291609b404de57cce0a))
* correct version in "update available" ([23ffa44](https://github.com/iFraan/streamystats/commit/23ffa441b4279b44acca891a02f1ea5f821e0841))
* create user if login before user sync ([32c6fd9](https://github.com/iFraan/streamystats/commit/32c6fd996dc839842dd571adc2d3a2d522c61994))
* delete and ignore duplicate playback session entries ([1a2f945](https://github.com/iFraan/streamystats/commit/1a2f9451626e9f21175fa9804b54e17d2c6e86c1))
* design ([446c790](https://github.com/iFraan/streamystats/commit/446c7909c991459f972a9c7a72d82de011cdf9a9))
* design ([0f3aa83](https://github.com/iFraan/streamystats/commit/0f3aa83a1453445969176038f84db03e9598bb49))
* design ([7664f3f](https://github.com/iFraan/streamystats/commit/7664f3fc51b90be3bf173ab852dffbd000e8847b))
* docker image for pgvector ([93137b9](https://github.com/iFraan/streamystats/commit/93137b997bd1a2ecb2ec5795abf554449b5a65e1))
* docs ([00a9bc5](https://github.com/iFraan/streamystats/commit/00a9bc5ec781dcf1ded779b5b32333430f541191))
* don't log from db ([78c4816](https://github.com/iFraan/streamystats/commit/78c4816da5c02eef5f2aa160ada0c7d11390a537))
* don't update version ([c002e26](https://github.com/iFraan/streamystats/commit/c002e264d8fdc0a2faf743b1305f1704319d0125))
* edge tag still used in version check ([143c8db](https://github.com/iFraan/streamystats/commit/143c8dbfd48b342813489b01802ff720defd0b32))
* embedding count when server restarts ([60a36d6](https://github.com/iFraan/streamystats/commit/60a36d61377fdbc77043dee040eff9f6eddc45f2))
* ensure resource cleanup after export failure in backup_controller to prevent resource leaks ([fdcaba0](https://github.com/iFraan/streamystats/commit/fdcaba09c34a1ac90f5d96738c59a8a0c20f3819))
* errors ([fa657b8](https://github.com/iFraan/streamystats/commit/fa657b85baccc266166d845e6a36f37c05ae8e4e))
* filter by type ([24ff630](https://github.com/iFraan/streamystats/commit/24ff6308a8ef04b36540fdd4890c79071dfe2f3f))
* handle large item requests + don't truncate text ([4e054bc](https://github.com/iFraan/streamystats/commit/4e054bc1a1986905ec6c81635422fb77f4742793))
* handle possible empty data ([0193dc3](https://github.com/iFraan/streamystats/commit/0193dc30bb443daacfb44401861126de8b6a0cd1))
* hide items ([191bdab](https://github.com/iFraan/streamystats/commit/191bdab4e70d759e1c9a0a4ae69e52937ec70b92))
* hide user count from non admin ([5ca29e7](https://github.com/iFraan/streamystats/commit/5ca29e792fa275d038540ef5fcb6dd5b1c491365))
* hide users page from non admin ([1d0bbdb](https://github.com/iFraan/streamystats/commit/1d0bbdb255e22190cc9321f025afcec744c600ed))
* history table pagination and user scoped data ([e184d0e](https://github.com/iFraan/streamystats/commit/e184d0ed924c626fb36b0cd8e7f310fc9ba4ba30))
* https://github.com/fredrikburmester/streamystats/issues/181 ([30a6e48](https://github.com/iFraan/streamystats/commit/30a6e48f0537aa71d3c395a32ade469ce3816437))
* icon ([75ca1f3](https://github.com/iFraan/streamystats/commit/75ca1f3dcb86b6c750741536b231f3e9019f1eb1))
* if edge don't use tag main ([93ee1f0](https://github.com/iFraan/streamystats/commit/93ee1f0c875faac2a2c3c48e8a641978cf8355a5))
* if none select all ([adde487](https://github.com/iFraan/streamystats/commit/adde487ca7b1fac31e8729730d15750e1fe7a395))
* ignore crash dumps ([4a3968e](https://github.com/iFraan/streamystats/commit/4a3968ee9773138ee8f615000328e4bcd4e9b8e5))
* ignore dist files from job server ([0577a13](https://github.com/iFraan/streamystats/commit/0577a13a45695f012067679dec47cb57d72456f2))
* implement orphaned item cleanup and enhance library processing in Jellyfin sync ([83a357a](https://github.com/iFraan/streamystats/commit/83a357a68fdcacf0946bff24b82686b6f2d3fb92))
* import error ([801d168](https://github.com/iFraan/streamystats/commit/801d168bd5829a4c0d778dfd3a36c32ad00d6fbb))
* improve error handling in configure_sqlite function to log failures when executing system command and parsing memory info ([ebd851a](https://github.com/iFraan/streamystats/commit/ebd851a1d9364b68fcc275f9df11982b9044a82c))
* improve jellyfin sync import by handling errors better ([e6bc339](https://github.com/iFraan/streamystats/commit/e6bc3390762b600a96881f213d6b11cc0b836f85))
* improve jellyfin sync reliability and error handling ([93c35cd](https://github.com/iFraan/streamystats/commit/93c35cd0e3e4cbf1eef9ffc3185c77f4eb6917ce))
* improve loading with server components ([1dc67fa](https://github.com/iFraan/streamystats/commit/1dc67fade7dd1ab932b1cf542d6dea1bf8906a4a))
* improve login page with servers list ([328f435](https://github.com/iFraan/streamystats/commit/328f435b056949d356be35f5e978c944e406dab1))
* improve release cicd ([2086fa0](https://github.com/iFraan/streamystats/commit/2086fa0ee93446800bac5a991063589f3ed97f1b))
* improve resize observer handling in ChartContainer to prevent potential memory leaks ([b2f27cd](https://github.com/iFraan/streamystats/commit/b2f27cda0b0fdb9ccf14d2c96c4e92114b18d801))
* improve settings page ([9cbeeec](https://github.com/iFraan/streamystats/commit/9cbeeecd6a99648975a01204163676464582900b))
* improve sync ([519217c](https://github.com/iFraan/streamystats/commit/519217c37f77ee64723755920028837a7ac4a6ed))
* improve user watch streak calculation reliability ([e62c637](https://github.com/iFraan/streamystats/commit/e62c6371e06f7e95126e25b0c4e1b0b23157fe32))
* include season item statistics ([118a484](https://github.com/iFraan/streamystats/commit/118a48443084c0a8e903a97c5f30cac308256774))
* include tools version ([174f6f7](https://github.com/iFraan/streamystats/commit/174f6f72d4090744b1f297aadf425fc4235e6308))
* incorrect redirect on base url / ([186d69c](https://github.com/iFraan/streamystats/commit/186d69cbaa3e3c340b9ddd374a6b85795d889b35))
* incorrect routing when going to / ([ec61238](https://github.com/iFraan/streamystats/commit/ec61238d5f03d680436d23da150bea575fd7ca67))
* incorrect transcoding logo ([78f3a21](https://github.com/iFraan/streamystats/commit/78f3a21782fc9d55fb805870598b879d98194c57))
* inf redirect new server ([97acfaa](https://github.com/iFraan/streamystats/commit/97acfaa1a60b725c560b55a2d9b6ff954ffeeb8e))
* instructions ([017dd29](https://github.com/iFraan/streamystats/commit/017dd29351481e512802d06ba5e393d37ae00152))
* instructions ([8b4ba54](https://github.com/iFraan/streamystats/commit/8b4ba546b6f74fb2a8a2458579a8eab3b841c43c))
* issues ([2763c7a](https://github.com/iFraan/streamystats/commit/2763c7ab10525e3082e8172e9f73f0cf1c70cec7))
* jellystat importer ([01833da](https://github.com/iFraan/streamystats/commit/01833dac65d5d334ee7397ac18eabe21973809e2))
* **job-server:** apply sourcery-ai suggestions wrt PORT validation ([86ef6a9](https://github.com/iFraan/streamystats/commit/86ef6a9543a751f1d56f22dee83becc1c07c4ea0))
* **job-server:** do not print warning for system activites ([30a6e48](https://github.com/iFraan/streamystats/commit/30a6e48f0537aa71d3c395a32ade469ce3816437))
* last run time for wrong sync task ([5ed8082](https://github.com/iFraan/streamystats/commit/5ed80827d1baca51720d6a6544aee53aa62fd18a))
* linting issue ([38c8f91](https://github.com/iFraan/streamystats/commit/38c8f91b9eedca496c357c70d3e18cf2490621e7))
* migrate to jellyfin uuid instead of custom id ([74e7803](https://github.com/iFraan/streamystats/commit/74e78038a0b4feed40a84bf1a8cb7e881e500c3f))
* migrate to jellyfin uuid instead of custom id ([1c454f4](https://github.com/iFraan/streamystats/commit/1c454f41dd816764a1fd053045eaeceb358e5a26))
* missing import ([c1c23ba](https://github.com/iFraan/streamystats/commit/c1c23baf3c2de4703166e5f9f556233857531aab))
* mobile design ([18edbab](https://github.com/iFraan/streamystats/commit/18edbab268462dc755a592e6ecc09db39d88e746))
* more secure routing ([800ea1b](https://github.com/iFraan/streamystats/commit/800ea1b1cb267865cf5e25639352ee86098c67e2))
* more spelling ([f1efa00](https://github.com/iFraan/streamystats/commit/f1efa00043768db3f16625528f6dd1acdd3fb9c9))
* move build variabled and move to node 23 ([e63e988](https://github.com/iFraan/streamystats/commit/e63e9889c609f9d5842a5f8f2cc392fecbb38508))
* move statistics placement ([f3bc735](https://github.com/iFraan/streamystats/commit/f3bc735d0fa8f28fe40e3a9244d436e2ad4e297c))
* naming images ([7605dae](https://github.com/iFraan/streamystats/commit/7605dae4cde570b34f25c9074d06967e9b371c90))
* naming of image ([f1811ee](https://github.com/iFraan/streamystats/commit/f1811eecc3e572084f2a7b2dced6698fdceba2c6))
* new bun lock file format ([936e568](https://github.com/iFraan/streamystats/commit/936e568fdcf89964cb63a52972907cb6794f5c5c))
* new postgres image ([e5fcb7c](https://github.com/iFraan/streamystats/commit/e5fcb7cf8b73994ad943f00f0332186e3a768918))
* **next-app:** /setup is admin only unless there are no servers configured ([dd58e4b](https://github.com/iFraan/streamystats/commit/dd58e4b2eb4f37938fec2a1b9bf03a71704baa08))
* **nextjs-app:** correctly set body size limit ([03e59ac](https://github.com/iFraan/streamystats/commit/03e59accdfb956c04c862a9d6206bef3274bc3dc))
* no frozen lockfile ([14f4668](https://github.com/iFraan/streamystats/commit/14f46682b60d993f2aa94863b97ae3266a4f0b9e))
* no jumping sort in active sessions ([5043379](https://github.com/iFraan/streamystats/commit/5043379f7eb37befefdcbf03def2137ff2e68b85))
* only admin can see active sessions ([da4e30a](https://github.com/iFraan/streamystats/commit/da4e30a01c2fb4d246df62eab3c42d15cb9e7810))
* only show UpdateNotifier to admin ([9fdf79b](https://github.com/iFraan/streamystats/commit/9fdf79b1d0af40700fd54ad1d51dbbe5ce9380f2)), closes [#44](https://github.com/iFraan/streamystats/issues/44)
* padding ([3070dde](https://github.com/iFraan/streamystats/commit/3070ddeb9ef7c404c594628d747768ab2c25fc85))
* poster quality ([f79b7c1](https://github.com/iFraan/streamystats/commit/f79b7c1d0402447e28465698341c76a8235ed42a))
* Prevent duplicate item conflicts during DB batch operations ([bda533a](https://github.com/iFraan/streamystats/commit/bda533a78d3129271153623dc63d5f836b3c64df))
* push version tag? ([6df2ced](https://github.com/iFraan/streamystats/commit/6df2ced9a73538e89dc4f6b3f6e18ca51f992f6f))
* redirect to login ([cda9a1e](https://github.com/iFraan/streamystats/commit/cda9a1e581744c9af691cdecbc66d9e762a2568c))
* redirect to login ([7029144](https://github.com/iFraan/streamystats/commit/7029144d5f256838dae91a4e8067cddd28cfe8f1))
* refactor settings page and sidebar ([8b3a141](https://github.com/iFraan/streamystats/commit/8b3a141ce4b32483f2e65e64be2c5ba0d0f68904))
* release notes ([9ea1a30](https://github.com/iFraan/streamystats/commit/9ea1a30adbbe66d76a29d4932c3e171a045ab571))
* remove bad healthcheck ([576d2f5](https://github.com/iFraan/streamystats/commit/576d2f5d496f77a9cc8fdd14c87e8a49e52a654a))
* remove build time [skip ci] ([22d90a7](https://github.com/iFraan/streamystats/commit/22d90a7045b92a760ca5b5019c60629766b4479f))
* remove dotenv ([8ae1182](https://github.com/iFraan/streamystats/commit/8ae1182925146912eddefe7746d134860be043f3))
* remove logging ([e7d1ed6](https://github.com/iFraan/streamystats/commit/e7d1ed644ad96e37a75d2f49a55cc45fc9d127e6))
* remove logs [skip ci] ([e741703](https://github.com/iFraan/streamystats/commit/e74170385df8e110136b42911794168621e51c3e))
* remove old users and undefined error ([642ea33](https://github.com/iFraan/streamystats/commit/642ea33877948b11815cf452fb7d5097230bc4ca))
* remove publish workflow ([1d474d7](https://github.com/iFraan/streamystats/commit/1d474d70ef6cc728d8ea9b07e04a521cb2c283bd))
* remove references to playback activities ([5a74bdd](https://github.com/iFraan/streamystats/commit/5a74bdd9c1cc5245afac881e116ac2ff658635fc))
* remove references to playback_activity ([a458363](https://github.com/iFraan/streamystats/commit/a4583633ab5d42167590bf6b31154f2794e17de2))
* removed library causes failed sync ([260fa0b](https://github.com/iFraan/streamystats/commit/260fa0b1c1dd0e6651490eabb60eefe9534149fd))
* restructure sidebar sections ([4209677](https://github.com/iFraan/streamystats/commit/4209677b184c76707cb780f06e1b88e390654a0f))
* sanitize name and ensure name is never null ([01729b4](https://github.com/iFraan/streamystats/commit/01729b44f1fe953aaa0ac37160dc2dd0c4d0047b))
* save dismissed new version hash - don't show again ([1b3574a](https://github.com/iFraan/streamystats/commit/1b3574a882d5ca6f65df024f280576290f899d90))
* set correct tag ([48d7729](https://github.com/iFraan/streamystats/commit/48d77296bddad03e6876b3deeae02e0c8f036f80))
* show only update available for admin ([600b4c8](https://github.com/iFraan/streamystats/commit/600b4c84db111c1d451a4dc7e2788e660cac4062))
* showing edge label in ui ([91c624b](https://github.com/iFraan/streamystats/commit/91c624babedda484271cc0c7d36902e7154673ce))
* skip folders ([fc4c2e0](https://github.com/iFraan/streamystats/commit/fc4c2e0e62d0095a889cddb8a331c8220ac0e15b))
* small issues ([abb58ba](https://github.com/iFraan/streamystats/commit/abb58ba0b80416948df694e63ffcd1e19c88560a))
* sort by watchtime ([8aa5609](https://github.com/iFraan/streamystats/commit/8aa5609a55eeeae90df67c1eb597cdd2aefc41ce))
* specify on ([d62afdd](https://github.com/iFraan/streamystats/commit/d62afdd038bebb85ceb5fe41f0db458bf809840b))
* specify on ([e2b4d69](https://github.com/iFraan/streamystats/commit/e2b4d696ffef47589c0a0f329a0409851da56e38))
* spelling ([df7b176](https://github.com/iFraan/streamystats/commit/df7b176604f69660d8c621b0e3011ef5cf533bc9))
* spelling ([3827cfc](https://github.com/iFraan/streamystats/commit/3827cfcc70547f18984f57859486731cf1947bac))
* spelling ([b9cf948](https://github.com/iFraan/streamystats/commit/b9cf948e0ded3e0110bdb06fe1845ee992e25f08))
* spelling and grammer ([9a4a681](https://github.com/iFraan/streamystats/commit/9a4a681034503c3d8c9d0c1d567a9bc3f2f51bbd))
* sync ([6fd93d6](https://github.com/iFraan/streamystats/commit/6fd93d6fdd40ff937c23ee7beb9b9c6670128ac9))
* text ([7440705](https://github.com/iFraan/streamystats/commit/74407058d7112bf9c83de9c989960bb3e13b4404))
* try to fix image version tags ([7422547](https://github.com/iFraan/streamystats/commit/7422547911b48cf275423bd635ecca8290756f30))
* type error ([fb3048d](https://github.com/iFraan/streamystats/commit/fb3048d5bd6b6948bf62bcb48391b90954428efa))
* type errors ([dd88753](https://github.com/iFraan/streamystats/commit/dd88753e2373f567ec547f435efb7cf1763df795))
* undefined reduce ([24f0226](https://github.com/iFraan/streamystats/commit/24f02260affcc0479452532af3b4e2247899da1b)), closes [#85](https://github.com/iFraan/streamystats/issues/85)
* unused code ([baf1004](https://github.com/iFraan/streamystats/commit/baf100445e362ebc2b989941261617bdbda408f9))
* update dismiss saved not working ([2654155](https://github.com/iFraan/streamystats/commit/2654155885f893c6da10e5b1ab252fd562f27de4))
* update next ([e4e7822](https://github.com/iFraan/streamystats/commit/e4e782206714e9c491bd1472370daa40e59a6073))
* update readme [skip ci] ([0647e8a](https://github.com/iFraan/streamystats/commit/0647e8a70729de94aca5ebb7eb52f10ffadea531))
* update user page to handle optional searchParams and improve HistoryTable props ([8a215d0](https://github.com/iFraan/streamystats/commit/8a215d08bf85fb5fb380c5906888d39572a6011c))
* use bearer token ([cc85d5b](https://github.com/iFraan/streamystats/commit/cc85d5b7b750502bf0dcf1264d2c26f850a75a63))
* use correct DirectPlay when importing data ([3781f1c](https://github.com/iFraan/streamystats/commit/3781f1c2df76da3f889e17319d6750e4ea92a661))
* use correct tz ([0d2082e](https://github.com/iFraan/streamystats/commit/0d2082e6d6ccf37c27b80d53f3f5526560b3d7a4))
* use name not userId for ActiveSessions and UserLeaderBoardTable user page linking ([30f9b70](https://github.com/iFraan/streamystats/commit/30f9b70e2fcfd473ec80e53aa5a531fcd6454b65))
* use node instead of bun ([8e3a961](https://github.com/iFraan/streamystats/commit/8e3a96138f3e39a8472478569e1d15d9fc01211a))
* use pgvector ([b030313](https://github.com/iFraan/streamystats/commit/b03031395e9ea78dc4a8e11283efa4b303ba2ea0))
* users WatchTimePerDay - date formatting ([9bab785](https://github.com/iFraan/streamystats/commit/9bab785305f4fb738f3df5fec085b2b84d9e36c5))
* version ([92a0e96](https://github.com/iFraan/streamystats/commit/92a0e9648368e3450203e9d0f5f873a4b9b6f1fe))
* width ([201f365](https://github.com/iFraan/streamystats/commit/201f365222df19c3cc35c60623d7a8d8b170871a))
* wording [skip ci] ([df07033](https://github.com/iFraan/streamystats/commit/df0703313c03bb1e51e91a1199ef9dfb33235753))
* workflows ([e9f14be](https://github.com/iFraan/streamystats/commit/e9f14be69bdc3f45442beff7b286787cbd41096b))
* wrong weekday ([40e30aa](https://github.com/iFraan/streamystats/commit/40e30aaf26fe407af3649a497be5ee9c7dd8ebe8))
* zombie process ([98548f6](https://github.com/iFraan/streamystats/commit/98548f63b13b42348ff21cba4beb66175cf4af94))

## [2.4.0](https://github.com/fredrikburmester/streamystats/compare/v2.3.0...v2.4.0) (2025-07-21)


### Features

* build PR images ([49f1bbe](https://github.com/fredrikburmester/streamystats/commit/49f1bbeb65f8ef869c033e5da58bd9a6a38e66b2))


### Bug Fixes

* avatars in users table ([bcefacb](https://github.com/fredrikburmester/streamystats/commit/bcefacb08472f642952d77532969f62a9615ba0b))
* build error ([48f0db3](https://github.com/fredrikburmester/streamystats/commit/48f0db38384a253ac980fd14ca66539552a13d98))
* build error ([9f5d2c5](https://github.com/fredrikburmester/streamystats/commit/9f5d2c5b547b3d4c68d22b713bc7f6be55bac90c))
* https://github.com/fredrikburmester/streamystats/issues/181 ([30a6e48](https://github.com/fredrikburmester/streamystats/commit/30a6e48f0537aa71d3c395a32ade469ce3816437))
* ignore dist files from job server ([0577a13](https://github.com/fredrikburmester/streamystats/commit/0577a13a45695f012067679dec47cb57d72456f2))
* **job-server:** do not print warning for system activites ([30a6e48](https://github.com/fredrikburmester/streamystats/commit/30a6e48f0537aa71d3c395a32ade469ce3816437))
* **next-app:** /setup is admin only unless there are no servers configured ([dd58e4b](https://github.com/fredrikburmester/streamystats/commit/dd58e4b2eb4f37938fec2a1b9bf03a71704baa08))

## [2.3.0](https://github.com/fredrikburmester/streamystats/compare/v2.2.0...v2.3.0) (2025-07-20)


### Features

* build manual version tag ([bdf6685](https://github.com/fredrikburmester/streamystats/commit/bdf66851ade6ea80e75b2a00933da60fc9e9a37e))
* details page ([de987e9](https://github.com/fredrikburmester/streamystats/commit/de987e9282858f799a1d245cdddd12a43b851d25))
* filter out non-media types in genre stats ([1fcceb6](https://github.com/fredrikburmester/streamystats/commit/1fcceb6734250ce6948bd7bfd1923281458064a2))
* set host in compose files ([8236e3f](https://github.com/fredrikburmester/streamystats/commit/8236e3fa51f9a35d2fc2e4287daf8187b1480df7))


### Bug Fixes

* build error ([9beb9cb](https://github.com/fredrikburmester/streamystats/commit/9beb9cb70cc43f9327ef25bdaa2fce6c13844c8b))
* build error ([e8d6b5d](https://github.com/fredrikburmester/streamystats/commit/e8d6b5dfc1a3f166e309ecc877293b187dfb5eac))
* build errors ([f18ff49](https://github.com/fredrikburmester/streamystats/commit/f18ff49fa39db871b345af4834b7bda5dd8072ee))
* no frozen lockfile ([14f4668](https://github.com/fredrikburmester/streamystats/commit/14f46682b60d993f2aa94863b97ae3266a4f0b9e))
* showing edge label in ui ([91c624b](https://github.com/fredrikburmester/streamystats/commit/91c624babedda484271cc0c7d36902e7154673ce))
* update next ([e4e7822](https://github.com/fredrikburmester/streamystats/commit/e4e782206714e9c491bd1472370daa40e59a6073))

## [2.2.0](https://github.com/fredrikburmester/streamystats/compare/v2.1.1...v2.2.0) (2025-07-18)


### Features

* aggregate episode stats for series ([22c55d9](https://github.com/fredrikburmester/streamystats/commit/22c55d94aa1f8fdca203afcf64d6c595735fe971))

## [2.1.1](https://github.com/fredrikburmester/streamystats/compare/v2.1.0...v2.1.1) (2025-07-18)


### Bug Fixes

* await params ([2acad96](https://github.com/fredrikburmester/streamystats/commit/2acad96446a91c7197a59b5a3c4e6fcb657c56bd))
* better auth ([af9858c](https://github.com/fredrikburmester/streamystats/commit/af9858cdf1b43549db06bbfd8442d0f60e02e1cb))
* build on main push ([67664ac](https://github.com/fredrikburmester/streamystats/commit/67664ac61c0af41f77fd733219dc9553435d4f79))
* release notes ([9ea1a30](https://github.com/fredrikburmester/streamystats/commit/9ea1a30adbbe66d76a29d4932c3e171a045ab571))

## [2.1.0](https://github.com/fredrikburmester/streamystats/compare/v2.0.0...v2.1.0) (2025-07-18)


### Features

* add horizontal scroll to similar statistics cards ([e54f907](https://github.com/fredrikburmester/streamystats/commit/e54f90723101a8deaee45c8cee2ea7427f448633))
* item details ([eb2c788](https://github.com/fredrikburmester/streamystats/commit/eb2c788904aa23a3e0cd1c3a93fa54a704285f1c))
* **job-server:** allow setting of listening host ([c98d82a](https://github.com/fredrikburmester/streamystats/commit/c98d82a84e7bbc71566ed2f9f68a7d964ca63c1c))
* **nextjs-app:** use next/image for MorphingDialogImage ([dc74fb3](https://github.com/fredrikburmester/streamystats/commit/dc74fb3521aa2a6037c0451fc9bb9f74229856d3))
* use ScrollArea and ScrollBar for horizontal scrolling in SimilarSeriesStatistics ([9648625](https://github.com/fredrikburmester/streamystats/commit/9648625a78aeefd7adf94b4d702f921c57596bcd))
* user sync ([9610f2c](https://github.com/fredrikburmester/streamystats/commit/9610f2c4d26ce6887c26271c385f10c9523a2b3b))


### Bug Fixes

* better user admin check ([afd3d25](https://github.com/fredrikburmester/streamystats/commit/afd3d25f2c9031bbecc8835e6c20ae4392d20dbe))
* **ci:** ensure pnpm is properly installed before use in workflow ([8649f9a](https://github.com/fredrikburmester/streamystats/commit/8649f9a6077389377c693f8625f45b57dfbd90d9))
* correct typo in SimilarStatistics component name ([9347c4f](https://github.com/fredrikburmester/streamystats/commit/9347c4fa2196738ea3b55291609b404de57cce0a))
* edge tag still used in version check ([143c8db](https://github.com/fredrikburmester/streamystats/commit/143c8dbfd48b342813489b01802ff720defd0b32))
* **job-server:** apply sourcery-ai suggestions wrt PORT validation ([86ef6a9](https://github.com/fredrikburmester/streamystats/commit/86ef6a9543a751f1d56f22dee83becc1c07c4ea0))
* **nextjs-app:** correctly set body size limit ([03e59ac](https://github.com/fredrikburmester/streamystats/commit/03e59accdfb956c04c862a9d6206bef3274bc3dc))
* removed library causes failed sync ([260fa0b](https://github.com/fredrikburmester/streamystats/commit/260fa0b1c1dd0e6651490eabb60eefe9534149fd))

## [2.0.0](https://github.com/fredrikburmester/streamystats/compare/v1.8.0...v2.0.0) (2025-06-07)


### ⚠ BREAKING CHANGES

* This is a major version upgrade with breaking changes requiring migration from v1.x to v2.x including database schema changes, new compose file and new Docker images

### Features

* major version 2.0.0 release ([d12e3aa](https://github.com/fredrikburmester/streamystats/commit/d12e3aa5a824dbbbd5e072966f3ac538e54afded))


### Bug Fixes

* instructions ([017dd29](https://github.com/fredrikburmester/streamystats/commit/017dd29351481e512802d06ba5e393d37ae00152))

## [1.7.3](https://github.com/fredrikburmester/streamystats/compare/streamystat-v1.7.2...streamystat-v1.7.3) (2025-05-21)


### Bug Fixes

* incorrect transcoding logo ([78f3a21](https://github.com/fredrikburmester/streamystats/commit/78f3a21782fc9d55fb805870598b879d98194c57))
* incorrect transcoding logo when imported data from plugin ([4ddc567](https://github.com/fredrikburmester/streamystats/commit/4ddc56757e84d338ce09b924248df74dfd32aa9d))
* refactor dashboard ([fd5b55a](https://github.com/fredrikburmester/streamystats/commit/fd5b55a71107f5443b06701d45cd2e2982120b33))
* refactor settings page and sidebar ([ef1d080](https://github.com/fredrikburmester/streamystats/commit/ef1d080cd840b51a86f1014ae73835f791f163c3))
* refactor settings page and sidebar ([8b3a141](https://github.com/fredrikburmester/streamystats/commit/8b3a141ce4b32483f2e65e64be2c5ba0d0f68904))

## [1.7.2](https://github.com/fredrikburmester/streamystats/compare/streamystat-v1.7.1...streamystat-v1.7.2) (2025-05-19)


### Bug Fixes

* update dismiss saved not working ([2654155](https://github.com/fredrikburmester/streamystats/commit/2654155885f893c6da10e5b1ab252fd562f27de4))

## [1.7.1](https://github.com/fredrikburmester/streamystats/compare/streamystat-v1.7.0...streamystat-v1.7.1) (2025-05-19)


### Bug Fixes

* auto start embedding ([646b63d](https://github.com/fredrikburmester/streamystats/commit/646b63de30f94b5e6d41954de170cc6c3a80e8fe))
* auto start embedding ([0284f35](https://github.com/fredrikburmester/streamystats/commit/0284f35e349f1490f4d77bc22339b6cbc29385aa))
* remove logs [skip ci] ([e741703](https://github.com/fredrikburmester/streamystats/commit/e74170385df8e110136b42911794168621e51c3e))
* save dismissed new version hash - don't show again ([27e216b](https://github.com/fredrikburmester/streamystats/commit/27e216bf112f752f0501bf62a767321dfff7b968))
* save dismissed new version hash - don't show again ([1b3574a](https://github.com/fredrikburmester/streamystats/commit/1b3574a882d5ca6f65df024f280576290f899d90))
* undefined reduce ([24f0226](https://github.com/fredrikburmester/streamystats/commit/24f02260affcc0479452532af3b4e2247899da1b)), closes [#85](https://github.com/fredrikburmester/streamystats/issues/85)

## [1.7.0](https://github.com/fredrikburmester/streamystats/compare/streamystat-v1.6.0...streamystat-v1.7.0) (2025-05-17)


### Features

* add average watch time and longest streak columns to UserTable with sorting functionality ([52bec4c](https://github.com/fredrikburmester/streamystats/commit/52bec4c96cf31aa76590d4f609f39297fb574cec))
* add size prop to Poster component and implement fallback for missing images ([d6ce62a](https://github.com/fredrikburmester/streamystats/commit/d6ce62ae97d0e38e6349603f0434bb38fe4df3a6))
* add utility function to format time since last activity in ActiveSessions component ([59695d2](https://github.com/fredrikburmester/streamystats/commit/59695d2b785e91be432d02948de9cd571c2fbc98))
* ai recommendations ([74893b7](https://github.com/fredrikburmester/streamystats/commit/74893b703203eeb2215ff72e61f2ba519523991e))
* enhance ActiveSessions component with improved layout, additional session details, and IP address display ([157ab07](https://github.com/fredrikburmester/streamystats/commit/157ab07f0c38a24cd9aa380a28bf3b21ca097b08))
* enhance ActiveSessions component with playback method badge and update session mapping for transcoding info ([0ce49fa](https://github.com/fredrikburmester/streamystats/commit/0ce49fa3aa33f41f92d7b32f6e71d410d61758f2))
* enhance dashboard cards to display percentage labels and improve responsiveness for better data visualization ([ea2311d](https://github.com/fredrikburmester/streamystats/commit/ea2311dcb436dfcab6ff59fb44063059f37c90ea))
* enhance dashboard cards with custom labels and filter out zero counts for better data representation ([c2ed475](https://github.com/fredrikburmester/streamystats/commit/c2ed47544c7f3359539db5c5d3a6be90fe17864b))
* enhance ItemWatchStatsTable with improved sorting, additional item details, and responsive layout adjustments ([0cd9a31](https://github.com/fredrikburmester/streamystats/commit/0cd9a3176786ffab5894e1a28a19710bffd9c0df))
* enhance user activity tables with links to user profiles and improve chart responsiveness ([89e943c](https://github.com/fredrikburmester/streamystats/commit/89e943c6c24de52a5a453c3b8b94f413b7971323))
* enhance user interface with improved hover effects and link functionality across activity and user tables ([9df24e1](https://github.com/fredrikburmester/streamystats/commit/9df24e1271b96627ea399160e5a8b602a726b1a5))
* enhance user interface with JellyfinAvatar component and improve session display ([df93e51](https://github.com/fredrikburmester/streamystats/commit/df93e519f1e7ccda12295d5f75ccd807d7af8f19))
* integrate Poster component into HistoryTable and ItemWatchStatsTable for improved item display ([6f696a5](https://github.com/fredrikburmester/streamystats/commit/6f696a5b7e273a76e0a582c1c8d4632963a5d86b))
* pwa ([f59f6b5](https://github.com/fredrikburmester/streamystats/commit/f59f6b526693deae1328969500ba01e11fa10a9c))
* replace Avatar component with JellyfinAvatar for user display in UserLeaderboardTable ([cd1994b](https://github.com/fredrikburmester/streamystats/commit/cd1994b8b1bc098e51d4aa85f174fb82a019d476))
* user leaderboard on dashboard ([9b4f4cb](https://github.com/fredrikburmester/streamystats/commit/9b4f4cbd993f9908e3b215049116e84a3ee45777)), closes [#52](https://github.com/fredrikburmester/streamystats/issues/52)


### Bug Fixes

* add parent and index numbers to session mapping ([9440f5c](https://github.com/fredrikburmester/streamystats/commit/9440f5cd093e936cf412ed93eddc723d71fa5856))
* correct pluralization in 'No items watched yet' message in MostWatchedItems ([d5dcf83](https://github.com/fredrikburmester/streamystats/commit/d5dcf836ddb5496d5e8e8574c6b31779cf0fa8f6))
* correct pluralization in 'No items watched yet' message in MostWatchedItems component ([2dbe5c1](https://github.com/fredrikburmester/streamystats/commit/2dbe5c13fe8548964a61623f39c99bba681961af))
* design ([0f3aa83](https://github.com/fredrikburmester/streamystats/commit/0f3aa83a1453445969176038f84db03e9598bb49))
* improve resize observer handling in ChartContainer to prevent potential memory leaks ([b2f27cd](https://github.com/fredrikburmester/streamystats/commit/b2f27cda0b0fdb9ccf14d2c96c4e92114b18d801))
* update user page to handle optional searchParams and improve HistoryTable props ([8a215d0](https://github.com/fredrikburmester/streamystats/commit/8a215d08bf85fb5fb380c5906888d39572a6011c))

## [1.6.0](https://github.com/fredrikburmester/streamystats/compare/streamystat-v1.5.0...streamystat-v1.6.0) (2025-04-26)


### Features

* sync recently added items every other minute ([ec6b90e](https://github.com/fredrikburmester/streamystats/commit/ec6b90edcbdc0d32210dd0adbcd8dfdada4329a8))


### Bug Fixes

* container listening on 0.0.0.0 ([d5f013a](https://github.com/fredrikburmester/streamystats/commit/d5f013aa69c2d1b4de3244c4270dd753407fa27c))
* container listening on all interfaces ([b34cb1b](https://github.com/fredrikburmester/streamystats/commit/b34cb1b9dd1bdc5a8586e595accf05826d48ab67))
* only show UpdateNotifier to admin ([9fdf79b](https://github.com/fredrikburmester/streamystats/commit/9fdf79b1d0af40700fd54ad1d51dbbe5ce9380f2)), closes [#44](https://github.com/fredrikburmester/streamystats/issues/44)

## [1.5.0](https://github.com/fredrikburmester/streamystats/compare/streamystat-v1.4.0...streamystat-v1.5.0) (2025-04-23)


### Features

* new transcoding statistics ([f08b8d1](https://github.com/fredrikburmester/streamystats/commit/f08b8d1e9431a68a645f31013c49c0cfdb75fab2))
* new transcoding statistics cards ([d28f6ea](https://github.com/fredrikburmester/streamystats/commit/d28f6ea65c227b95d1e98ad08baf8db695dbfe53))


### Bug Fixes

* alert dialog broke import ([5d23841](https://github.com/fredrikburmester/streamystats/commit/5d23841cb622a90c101d21629bf4700cf7a579e2))
* move statistics placement ([f3bc735](https://github.com/fredrikburmester/streamystats/commit/f3bc735d0fa8f28fe40e3a9244d436e2ad4e297c))
* use correct tz ([0d2082e](https://github.com/fredrikburmester/streamystats/commit/0d2082e6d6ccf37c27b80d53f3f5526560b3d7a4))

## [1.4.0](https://github.com/fredrikburmester/streamystats/compare/streamystat-v1.3.0...streamystat-v1.4.0) (2025-04-21)


### Features

* active sessions ([a6d95c3](https://github.com/fredrikburmester/streamystats/commit/a6d95c3c328eea12b1ed33fdc9118cc843b449b0))
* activities log + series/movies split in dashboard statistics ([db15983](https://github.com/fredrikburmester/streamystats/commit/db15983476a14dfdfa51a74cdc83abdc55052cf8))
* activity log ([9904dd2](https://github.com/fredrikburmester/streamystats/commit/9904dd2f5dc303612cd3669b6e7a205f042f1a29))
* add error boundary to page ([4147dcd](https://github.com/fredrikburmester/streamystats/commit/4147dcdfd2fc0868b60d934ab7be8c59ca1c2ae5))
* add release please ([b40fdaa](https://github.com/fredrikburmester/streamystats/commit/b40fdaad038c4cf296c15cd2f9815b5f87b01362))
* added item watch statistics ([165259c](https://github.com/fredrikburmester/streamystats/commit/165259c492e54984bf2fba566a01d636a4f4fbc5))
* delete add server as admin ([33c7a36](https://github.com/fredrikburmester/streamystats/commit/33c7a363991e788bdb49149723490b8300e5e9be))
* handle auth in middleware ([7d29d3a](https://github.com/fredrikburmester/streamystats/commit/7d29d3ae0fe1b32f072197fc511517a26fcebc60))
* hide most watch sections ([defd5bd](https://github.com/fredrikburmester/streamystats/commit/defd5bdc6c3888167f89d4f6dcfd366cdc2ca940))
* images ([0480bee](https://github.com/fredrikburmester/streamystats/commit/0480bee9dbf5a616c1ae4b7af33b337d046d35fb))
* import data from jellystat ([f0c39d5](https://github.com/fredrikburmester/streamystats/commit/f0c39d50707310216e11a293a5a1879ab9747a6e))
* import/export/backup session data from Streamystats ([63ec9a3](https://github.com/fredrikburmester/streamystats/commit/63ec9a37cb3d0e191da636f07e059b3be7847286))
* item specific statistics + api endpoint for items ([da5361d](https://github.com/fredrikburmester/streamystats/commit/da5361d8271f3fc708d6eb2d17f6ad82bfa7ec4a))
* item specific statistics + api endpoint for items ([26d7584](https://github.com/fredrikburmester/streamystats/commit/26d75842821f39c7f3019ff8a82840a12640769e))
* library stats ([f1efa1d](https://github.com/fredrikburmester/streamystats/commit/f1efa1da23e6296672d574228cb1339cb0424f26))
* most watched items ([b8a2f31](https://github.com/fredrikburmester/streamystats/commit/b8a2f31a6f726dbf36ef03d508bd95f6d68ee7b6))
* movie/episode split for dashboard stats ([167dc32](https://github.com/fredrikburmester/streamystats/commit/167dc327c7773c59fe0d0cb91bc1186d37bbbae2))
* new favicon ([c644990](https://github.com/fredrikburmester/streamystats/commit/c64499008daf2049346a615a7a8d1ae7c7bad734))
* personal stats including spider graph for genres ([da8a664](https://github.com/fredrikburmester/streamystats/commit/da8a66411814d0e698f20ddf1db590d8a3d1b45c))
* playback reporting plugin import data ([0f94891](https://github.com/fredrikburmester/streamystats/commit/0f9489199ff2890e4296f522b289d82fef2d52ca))
* playback reporting plugin import data ([f72ff9a](https://github.com/fredrikburmester/streamystats/commit/f72ff9a201fc708af30dcbf71714df3f1303dd4a))
* posters ([79e4acc](https://github.com/fredrikburmester/streamystats/commit/79e4acc2ea19724403fa1ebbf698a79471f2e66a))
* pre-work for eventual tautulli import ([7b4c946](https://github.com/fredrikburmester/streamystats/commit/7b4c946f240d25c31714a4e36e44c5276960e0ea))
* remove playback reporting plugin dep and use sessions instead ([dbc43b3](https://github.com/fredrikburmester/streamystats/commit/dbc43b37dba680481eca578c703cb0470606b8f6))
* show active sessions on dashboard ([fd7c4f8](https://github.com/fredrikburmester/streamystats/commit/fd7c4f8ea5bbedc81d8654154c823173a198fddb))
* specify libraries included on libraries page ([d63b72c](https://github.com/fredrikburmester/streamystats/commit/d63b72cf9255b90e4f78098e1c46383441090019))
* svg icon ([e369d27](https://github.com/fredrikburmester/streamystats/commit/e369d2737fc4e91ea2dc352d759e0349cbc7191a))
* total watch time for series in history table ([95bbd3a](https://github.com/fredrikburmester/streamystats/commit/95bbd3a1ca68f1e3f0a0c25692d40715b356eec3))
* user longest streak ([d3caff0](https://github.com/fredrikburmester/streamystats/commit/d3caff0de2ea1676eaa67e8be82c623097bb7f6d))
* version badge and toast ([f5993bb](https://github.com/fredrikburmester/streamystats/commit/f5993bbf1d32d1ae857fa5853976972aea2753e1))
* watch time per hour ([61c9903](https://github.com/fredrikburmester/streamystats/commit/61c9903c2471ae2a7c6963090d8ec0ac051d7d96))


### Bug Fixes

* add cache control to release fetch ([8410505](https://github.com/fredrikburmester/streamystats/commit/8410505924ad7681f8b4b70cd4df541fb622b371))
* add cache to search items ([256834b](https://github.com/fredrikburmester/streamystats/commit/256834b0616ae6d240b2b0f402db5bdb16211bce))
* add debug logs ([9252616](https://github.com/fredrikburmester/streamystats/commit/9252616a606e0fe3d3a023691ccdb1447782d734))
* add gitignore ([f3cf783](https://github.com/fredrikburmester/streamystats/commit/f3cf7834179d650fc4d80a24fe94584e514491da))
* add modal confirm with info about duplicate entires ([891d9e7](https://github.com/fredrikburmester/streamystats/commit/891d9e7d52fcdd58f4c190af85700c074a3d990a))
* add sha to version badge [skip ci] ([5945318](https://github.com/fredrikburmester/streamystats/commit/5945318ba865823379e63d5fa5f8f857ebf36db9))
* add subtitle ([fb71529](https://github.com/fredrikburmester/streamystats/commit/fb715292b3cd1170288334eea8d0260719694c10))
* allow auth header (or cookie) ([56cd123](https://github.com/fredrikburmester/streamystats/commit/56cd1239fce8db921ee4b5edd1a0b9f51aa32958))
* better filtering ([23ab43b](https://github.com/fredrikburmester/streamystats/commit/23ab43bc6ef59b0ca5984f9e4c36a7b45238cd2a))
* better sync and cleanup ([229be4e](https://github.com/fredrikburmester/streamystats/commit/229be4e607975483baca238db197af0a25503306))
* breadcrumb casing ([3d56eaf](https://github.com/fredrikburmester/streamystats/commit/3d56eafb526287965add6068611b0e6807e36edb))
* broken home link ([eb32d96](https://github.com/fredrikburmester/streamystats/commit/eb32d96ad33ead86c30ce84788047cbeb5e9c45c))
* build ([73924c8](https://github.com/fredrikburmester/streamystats/commit/73924c8e6c5107c37aa4b5520458a420a0a56cfd))
* change name to library ([03d7089](https://github.com/fredrikburmester/streamystats/commit/03d70894c069cea9ce452713cc741e3ec88c8453))
* checkmark ([35c8fd6](https://github.com/fredrikburmester/streamystats/commit/35c8fd6b9abd8e55200902ac22bf78745cf58769))
* clear design for login/setup ([e0e24c0](https://github.com/fredrikburmester/streamystats/commit/e0e24c092c5b31854178d7c4d98cbe5a2252ed9b))
* combine accordion [skip ci] ([95b137f](https://github.com/fredrikburmester/streamystats/commit/95b137f62449c5466f223b121337d25f9dbf735b))
* cookie use in wrong context ([4c30d78](https://github.com/fredrikburmester/streamystats/commit/4c30d780a93164f956ecdb292563ad60f77a668e))
* cookie use in wrong context (2) ([8f20750](https://github.com/fredrikburmester/streamystats/commit/8f20750ae170ff36bb0ffc32a3bfe63d1cc03282))
* cookie use in wrong context (3) ([b1744bd](https://github.com/fredrikburmester/streamystats/commit/b1744bd42c057b48f9c7b37ac45f9dd4a1b0e812))
* cookies on safari ([20a2160](https://github.com/fredrikburmester/streamystats/commit/20a2160957354b0cbe96617acc013b5d1c98e3c3))
* correct instructions ([61d03c8](https://github.com/fredrikburmester/streamystats/commit/61d03c8caf70d8f050e919a3f71eae2d77f20360))
* correct version in "update available" ([23ffa44](https://github.com/fredrikburmester/streamystats/commit/23ffa441b4279b44acca891a02f1ea5f821e0841))
* create user if login before user sync ([32c6fd9](https://github.com/fredrikburmester/streamystats/commit/32c6fd996dc839842dd571adc2d3a2d522c61994))
* design ([7664f3f](https://github.com/fredrikburmester/streamystats/commit/7664f3fc51b90be3bf173ab852dffbd000e8847b))
* design ([f84cf1e](https://github.com/fredrikburmester/streamystats/commit/f84cf1ef97e8eac78da396894c6a04f27502fb6b))
* don't use secure cookie for local deploy ([7d75ae1](https://github.com/fredrikburmester/streamystats/commit/7d75ae1fe75ee0b17a9e3697225c099e499b335d))
* even more logs and robust checking ([f50f0f8](https://github.com/fredrikburmester/streamystats/commit/f50f0f8b876e4da9909350acdcdc63f557520fdc))
* fetch correct server ([9f371e4](https://github.com/fredrikburmester/streamystats/commit/9f371e4506a64a159bf830d226c0bc408405caa9))
* fetch correct server on settings page ([b1beebb](https://github.com/fredrikburmester/streamystats/commit/b1beebb67b4b19d2676a133bd9b80edeac444b51))
* filter by type ([24ff630](https://github.com/fredrikburmester/streamystats/commit/24ff6308a8ef04b36540fdd4890c79071dfe2f3f))
* forgot users page in middleware ([fd73dfc](https://github.com/fredrikburmester/streamystats/commit/fd73dfceb5ed5bf1244d2352c91de053f4fea958))
* handle possible empty data ([0193dc3](https://github.com/fredrikburmester/streamystats/commit/0193dc30bb443daacfb44401861126de8b6a0cd1))
* hide tasks for non admin users ([0853e2d](https://github.com/fredrikburmester/streamystats/commit/0853e2d4f17a179c53c29265d6ecd9b02975cbe3))
* hide user count from non admin ([5ca29e7](https://github.com/fredrikburmester/streamystats/commit/5ca29e792fa275d038540ef5fcb6dd5b1c491365))
* hide users page from non admin ([1d0bbdb](https://github.com/fredrikburmester/streamystats/commit/1d0bbdb255e22190cc9321f025afcec744c600ed))
* history table pagination and user scoped data ([e184d0e](https://github.com/fredrikburmester/streamystats/commit/e184d0ed924c626fb36b0cd8e7f310fc9ba4ba30))
* icon ([75ca1f3](https://github.com/fredrikburmester/streamystats/commit/75ca1f3dcb86b6c750741536b231f3e9019f1eb1))
* if none select all ([adde487](https://github.com/fredrikburmester/streamystats/commit/adde487ca7b1fac31e8729730d15750e1fe7a395))
* improve loading with server components ([1dc67fa](https://github.com/fredrikburmester/streamystats/commit/1dc67fade7dd1ab932b1cf542d6dea1bf8906a4a))
* improve login page with servers list ([328f435](https://github.com/fredrikburmester/streamystats/commit/328f435b056949d356be35f5e978c944e406dab1))
* improve middleware logic ([0d8d0f7](https://github.com/fredrikburmester/streamystats/commit/0d8d0f7a24afbd806d681c1a4a6fcb0a25228f29))
* improve settings page ([9cbeeec](https://github.com/fredrikburmester/streamystats/commit/9cbeeecd6a99648975a01204163676464582900b))
* incorrect dialog title location for sr ([e98e862](https://github.com/fredrikburmester/streamystats/commit/e98e862f29a3eb776f80e99919c9845ecf314bc9))
* incorrect redirect on base url / ([186d69c](https://github.com/fredrikburmester/streamystats/commit/186d69cbaa3e3c340b9ddd374a6b85795d889b35))
* incorrect routing when going to / ([ec61238](https://github.com/fredrikburmester/streamystats/commit/ec61238d5f03d680436d23da150bea575fd7ca67))
* inf redirect new server ([97acfaa](https://github.com/fredrikburmester/streamystats/commit/97acfaa1a60b725c560b55a2d9b6ff954ffeeb8e))
* instructions ([8b4ba54](https://github.com/fredrikburmester/streamystats/commit/8b4ba546b6f74fb2a8a2458579a8eab3b841c43c))
* last run time for wrong sync task ([5ed8082](https://github.com/fredrikburmester/streamystats/commit/5ed80827d1baca51720d6a6544aee53aa62fd18a))
* mobile design ([18edbab](https://github.com/fredrikburmester/streamystats/commit/18edbab268462dc755a592e6ecc09db39d88e746))
* modal for delete server ([136f636](https://github.com/fredrikburmester/streamystats/commit/136f636c888cbb84e5939474490f6b2175356d3f))
* more secure routing ([800ea1b](https://github.com/fredrikburmester/streamystats/commit/800ea1b1cb267865cf5e25639352ee86098c67e2))
* move build variabled and move to node 23 ([e63e988](https://github.com/fredrikburmester/streamystats/commit/e63e9889c609f9d5842a5f8f2cc392fecbb38508))
* name undefined ([4a1c08b](https://github.com/fredrikburmester/streamystats/commit/4a1c08bb95089c83b55b630287283ff8bb48d43d))
* new bun lock file format ([936e568](https://github.com/fredrikburmester/streamystats/commit/936e568fdcf89964cb63a52972907cb6794f5c5c))
* no jumping sort in active sessions ([5043379](https://github.com/fredrikburmester/streamystats/commit/5043379f7eb37befefdcbf03def2137ff2e68b85))
* only admin can see active sessions ([da4e30a](https://github.com/fredrikburmester/streamystats/commit/da4e30a01c2fb4d246df62eab3c42d15cb9e7810))
* padding ([3070dde](https://github.com/fredrikburmester/streamystats/commit/3070ddeb9ef7c404c594628d747768ab2c25fc85))
* redirect to login ([cda9a1e](https://github.com/fredrikburmester/streamystats/commit/cda9a1e581744c9af691cdecbc66d9e762a2568c))
* redirect to login ([7029144](https://github.com/fredrikburmester/streamystats/commit/7029144d5f256838dae91a4e8067cddd28cfe8f1))
* redirect to login if logged out ([17db124](https://github.com/fredrikburmester/streamystats/commit/17db124139a2d602e8e1c8b14013dbfde82d2692))
* remove build time [skip ci] ([22d90a7](https://github.com/fredrikburmester/streamystats/commit/22d90a7045b92a760ca5b5019c60629766b4479f))
* remove logging ([e7d1ed6](https://github.com/fredrikburmester/streamystats/commit/e7d1ed644ad96e37a75d2f49a55cc45fc9d127e6))
* remove old users and undefined error ([642ea33](https://github.com/fredrikburmester/streamystats/commit/642ea33877948b11815cf452fb7d5097230bc4ca))
* restructure sidebar sections ([4209677](https://github.com/fredrikburmester/streamystats/commit/4209677b184c76707cb780f06e1b88e390654a0f))
* save server id in cookie ([05143cd](https://github.com/fredrikburmester/streamystats/commit/05143cdee5ae979545df61408f48ee6b83efee57))
* server undefined ([74ee990](https://github.com/fredrikburmester/streamystats/commit/74ee9905afb23a7aa57f563abebcbb474a4a4fb2))
* set cookie secure flag based on X-Forwarded-Proto header ([e04bc5a](https://github.com/fredrikburmester/streamystats/commit/e04bc5a883900579c0fa07cbf207d549f05c1cce))
* show only update available for admin ([600b4c8](https://github.com/fredrikburmester/streamystats/commit/600b4c84db111c1d451a4dc7e2788e660cac4062))
* small changes ([c1c13cb](https://github.com/fredrikburmester/streamystats/commit/c1c13cb24a1b918a40ee29f092227126eda1cd27))
* specify on ([d62afdd](https://github.com/fredrikburmester/streamystats/commit/d62afdd038bebb85ceb5fe41f0db458bf809840b))
* spelling ([b9cf948](https://github.com/fredrikburmester/streamystats/commit/b9cf948e0ded3e0110bdb06fe1845ee992e25f08))
* text ([7440705](https://github.com/fredrikburmester/streamystats/commit/74407058d7112bf9c83de9c989960bb3e13b4404))
* title ([9965a81](https://github.com/fredrikburmester/streamystats/commit/9965a819cd98c5495a39a15ae99dcce0267267dc))
* undefined fix? ([1c15a50](https://github.com/fredrikburmester/streamystats/commit/1c15a50c4b0139d2bed56dba3f9ab6b8bec69530))
* use bearer token ([cc85d5b](https://github.com/fredrikburmester/streamystats/commit/cc85d5b7b750502bf0dcf1264d2c26f850a75a63))
* use node instead of bun ([8e3a961](https://github.com/fredrikburmester/streamystats/commit/8e3a96138f3e39a8472478569e1d15d9fc01211a))
* users WatchTimePerDay - date formatting ([9bab785](https://github.com/fredrikburmester/streamystats/commit/9bab785305f4fb738f3df5fec085b2b84d9e36c5))
* users WatchTimePerDay - Invalid Date ([77fce32](https://github.com/fredrikburmester/streamystats/commit/77fce325ded3e83727841a92f8b038ab565486d3))
* wording [skip ci] ([df07033](https://github.com/fredrikburmester/streamystats/commit/df0703313c03bb1e51e91a1199ef9dfb33235753))
* working ([54f8f2a](https://github.com/fredrikburmester/streamystats/commit/54f8f2a278bf8618604b3cd325883cfb46b37fd5))
* wrong weekday ([40e30aa](https://github.com/fredrikburmester/streamystats/commit/40e30aaf26fe407af3649a497be5ee9c7dd8ebe8))
