require('dotenv').config()




module.exports.base = process.env.WEBSITE;
module.exports.ajax = `${process.env.WEBSITE.trimEnd('/')}/wp-admin/admin-ajax.php`;
module.exports.ajaxFields = {
    login : 'ajaxlogin',
    register:'ajaxregister',
    comment_vote_callback: 'comment_vote_callback',
    movie_vote: 'add-vote'
};

module.exports.searchUrl = (search) => {
    return `${this.ajax}?s=${search}&action=dwls_search`;
}
