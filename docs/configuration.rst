.. _configuration:

*************
Configuration
*************

Paperless provides a wide range of customizations.
Depending on how you run paperless, these settings have to be defined in different
places.

*   If you run paperless on docker, ``paperless.conf`` is not used. Rather, configure
    paperless by copying necessary options to ``docker-compose.env``.
*   If you are running paperless on anything else, paperless will search for the
    configuration file in these locations and use the first one it finds:

    .. code::

        /path/to/paperless/paperless.conf
        /etc/paperless.conf
        /usr/local/etc/paperless.conf


Required services
#################

PAPERLESS_REDIS=<url>
    This is required for processing scheduled tasks such as email fetching, index
    optimization and for training the automatic document matcher.

    Defaults to redis://localhost:6379.

PAPERLESS_DBHOST=<hostname>
    By default, sqlite is used as the database backend. This can be changed here.
    Set PAPERLESS_DBHOST and PostgreSQL will be used instead of mysql.

PAPERLESS_DBPORT=<port>
    Adjust port if necessary.

    Default is 5432.

PAPERLESS_DBNAME=<name>
    Database name in PostgreSQL.

    Defaults to "paperless".

PAPERLESS_DBUSER=<name>
    Database user in PostgreSQL.

    Defaults to "paperless".

PAPERLESS_DBPASS=<password>
    Database password for PostgreSQL.

    Defaults to "paperless".

PAPERLESS_DBSSLMODE=<mode>
    SSL mode to use when connecting to PostgreSQL.

    See `the official documentation about sslmode <https://www.postgresql.org/docs/current/libpq-ssl.html>`_.

    Default is ``prefer``.

Paths and folders
#################

PAPERLESS_CONSUMPTION_DIR=<path>
    This where your documents should go to be consumed.  Make sure that it exists
    and that the user running the paperless service can read/write its contents
    before you start Paperless.

    Don't change this when using docker, as it only changes the path within the
    container. Change the local consumption directory in the docker-compose.yml
    file instead.

    Defaults to "../consume/", relative to the "src" directory.

PAPERLESS_DATA_DIR=<path>
    This is where paperless stores all its data (search index, SQLite database,
    classification model, etc).

    Defaults to "../data/", relative to the "src" directory.

PAPERLESS_MEDIA_ROOT=<path>
    This is where your documents and thumbnails are stored.

    You can set this and PAPERLESS_DATA_DIR to the same folder to have paperless
    store all its data within the same volume.

    Defaults to "../media/", relative to the "src" directory.

PAPERLESS_STATICDIR=<path>
    Override the default STATIC_ROOT here.  This is where all static files
    created using "collectstatic" manager command are stored.

    Unless you're doing something fancy, there is no need to override this.

    Defaults to "../static/", relative to the "src" directory.

PAPERLESS_FILENAME_FORMAT=<format>
    Changes the filenames paperless uses to store documents in the media directory.
    See :ref:`advanced-file_name_handling` for details.

    Default is none, which disables this feature.

PAPERLESS_LOGGING_DIR=<path>
    This is where paperless will store log files.

    Defaults to "``PAPERLESS_DATA_DIR``/log/".


Logging
#######

PAPERLESS_LOGROTATE_MAX_SIZE=<num>
    Maximum file size for log files before they are rotated, in bytes.

    Defaults to 1 MiB.

PAPERLESS_LOGROTATE_MAX_BACKUPS=<num>
    Number of rotated log files to keep.

    Defaults to 20.

Hosting & Security
##################

PAPERLESS_SECRET_KEY=<key>
    Paperless uses this to make session tokens. If you expose paperless on the
    internet, you need to change this, since the default secret is well known.

    Use any sequence of characters. The more, the better. You don't need to
    remember this. Just face-roll your keyboard.

    Default is listed in the file ``src/paperless/settings.py``.

PAPERLESS_ALLOWED_HOSTS<comma-separated-list>
    If you're planning on putting Paperless on the open internet, then you
    really should set this value to the domain name you're using.  Failing to do
    so leaves you open to HTTP host header attacks:
    https://docs.djangoproject.com/en/3.1/topics/security/#host-header-validation

    Just remember that this is a comma-separated list, so "example.com" is fine,
    as is "example.com,www.example.com", but NOT " example.com" or "example.com,"

    Defaults to "*", which is all hosts.

PAPERLESS_CORS_ALLOWED_HOSTS<comma-separated-list>
    You need to add your servers to the list of allowed hosts that can do CORS
    calls. Set this to your public domain name.

    Defaults to "http://localhost:8000".

PAPERLESS_FORCE_SCRIPT_NAME=<path>
    To host paperless under a subpath url like example.com/paperless you set
    this value to /paperless. No trailing slash!

    Defaults to none, which hosts paperless at "/".

PAPERLESS_STATIC_URL=<path>
    Override the STATIC_URL here.  Unless you're hosting Paperless off a
    subdomain like /paperless/, you probably don't need to change this.

    Defaults to "/static/".

PAPERLESS_AUTO_LOGIN_USERNAME=<username>
    Specify a username here so that paperless will automatically perform login
    with the selected user.

    .. danger::

        Do not use this when exposing paperless on the internet. There are no
        checks in place that would prevent you from doing this.

    Defaults to none, which disables this feature.

PAPERLESS_ADMIN_USER=<username>
    If this environment variable is specified, Paperless automatically creates
    a superuser with the provided username at start. This is useful in cases
    where you can not run the `createsuperuser` command seperately, such as Kubernetes
    or AWS ECS.

    Requires `PAPERLESS_ADMIN_PASSWORD` to be set.

    .. note::

        This will not change an existing [super]user's password, nor will
        it recreate a user that already exists. You can leave this throughout
        the lifecycle of the containers.

PAPERLESS_ADMIN_MAIL=<email>
    (Optional) Specify superuser email address. Only used when
    `PAPERLESS_ADMIN_USER` is set.

    Defaults to ``root@localhost``.

PAPERLESS_ADMIN_PASSWORD=<password>
    Only used when `PAPERLESS_ADMIN_USER` is set.
    This will be the password of the automatically created superuser.


PAPERLESS_COOKIE_PREFIX=<str>
    Specify a prefix that is added to the cookies used by paperless to identify
    the currently logged in user. This is useful for when you're running two
    instances of paperless on the same host.

    After changing this, you will have to login again.

    Defaults to ``""``, which does not alter the cookie names.

PAPERLESS_ENABLE_HTTP_REMOTE_USER=<bool>
    Allows authentication via HTTP_REMOTE_USER which is used by some SSO
    applications.

    .. warning::

        This will allow authentication by simply adding a ``Remote-User: <username>`` header
        to a request. Use with care! You especially *must* ensure that any such header is not
        passed from your proxy server to paperless.

        If you're exposing paperless to the internet directly, do not use this.

        Also see the warning `in the official documentation <https://docs.djangoproject.com/en/3.1/howto/auth-remote-user/#configuration>`.

    Defaults to `false` which disables this feature.

PAPERLESS_HTTP_REMOTE_USER_HEADER_NAME=<str>
    If `PAPERLESS_ENABLE_HTTP_REMOTE_USER` is enabled, this property allows to
    customize the name of the HTTP header from which the authenticated username
    is extracted. Values are in terms of
    [HttpRequest.META](https://docs.djangoproject.com/en/3.1/ref/request-response/#django.http.HttpRequest.META).
    Thus, the configured value must start with `HTTP_` followed by the
    normalized actual header name.

    Defaults to `HTTP_REMOTE_USER`.

.. _configuration-ocr:

OCR settings
############

Paperless uses `OCRmyPDF <https://ocrmypdf.readthedocs.io/en/latest/>`_ for
performing OCR on documents and images. Paperless uses sensible defaults for
most settings, but all of them can be configured to your needs.

PAPERLESS_OCR_LANGUAGE=<lang>
    Customize the language that paperless will attempt to use when
    parsing documents.

    It should be a 3-letter language code consistent with ISO
    639: https://www.loc.gov/standards/iso639-2/php/code_list.php

    Set this to the language most of your documents are written in.

    This can be a combination of multiple languages such as ``deu+eng``,
    in which case tesseract will use whatever language matches best.
    Keep in mind that tesseract uses much more cpu time with multiple
    languages enabled.

    Defaults to "eng".

		Note: If your language contains a '-' such as chi-sim, you must use chi_sim

PAPERLESS_OCR_MODE=<mode>
    Tell paperless when and how to perform ocr on your documents. Four modes
    are available:

    *   ``skip``: Paperless skips all pages and will perform ocr only on pages
        where no text is present. This is the safest option.
    *   ``skip_noarchive``: In addition to skip, paperless won't create an
        archived version of your documents when it finds any text in them.
        This is useful if you don't want to have two almost-identical versions
        of your digital documents in the media folder. This is the fastest option.
    *   ``redo``: Paperless will OCR all pages of your documents and attempt to
        replace any existing text layers with new text. This will be useful for
        documents from scanners that already performed OCR with insufficient
        results. It will also perform OCR on purely digital documents.

        This option may fail on some documents that have features that cannot
        be removed, such as forms. In this case, the text from the document is
        used instead.
    *   ``force``: Paperless rasterizes your documents, converting any text
        into images and puts the OCRed text on top. This works for all documents,
        however, the resulting document may be significantly larger and text
        won't appear as sharp when zoomed in.

    The default is ``skip``, which only performs OCR when necessary and always
    creates archived documents.

    Read more about this in the `OCRmyPDF documentation <https://ocrmypdf.readthedocs.io/en/latest/advanced.html#when-ocr-is-skipped>`_.

PAPERLESS_OCR_CLEAN=<mode>
    Tells paperless to use ``unpaper`` to clean any input document before
    sending it to tesseract. This uses more resources, but generally results
    in better OCR results. The following modes are available:

    *   ``clean``: Apply unpaper.
    *   ``clean-final``: Apply unpaper, and use the cleaned images to build the
        output file instead of the original images.
    *   ``none``: Do not apply unpaper.

    Defaults to ``clean``.

    .. note::

        ``clean-final`` is incompatible with ocr mode ``redo``. When both
        ``clean-final`` and the ocr mode ``redo`` is configured, ``clean``
        is used instead.

PAPERLESS_OCR_DESKEW=<bool>
    Tells paperless to correct skewing (slight rotation of input images mainly
    due to improper scanning)

    Defaults to ``true``, which enables this feature.

    .. note::

        Deskewing is incompatible with ocr mode ``redo``. Deskewing will get
        disabled automatically if ``redo`` is used as the ocr mode.

PAPERLESS_OCR_ROTATE_PAGES=<bool>
    Tells paperless to correct page rotation (90°, 180° and 270° rotation).

    If you notice that paperless is not rotating incorrectly rotated
    pages (or vice versa), try adjusting the threshold up or down (see below).

    Defaults to ``true``, which enables this feature.


PAPERLESS_OCR_ROTATE_PAGES_THRESHOLD=<num>
    Adjust the threshold for automatic page rotation by ``PAPERLESS_OCR_ROTATE_PAGES``.
    This is an arbitrary value reported by tesseract. "15" is a very conservative value,
    whereas "2" is a very aggressive option and will often result in correctly rotated pages
    being rotated as well.

    Defaults to "12".

PAPERLESS_OCR_OUTPUT_TYPE=<type>
    Specify the the type of PDF documents that paperless should produce.

    *   ``pdf``: Modify the PDF document as little as possible.
    *   ``pdfa``: Convert PDF documents into PDF/A-2b documents, which is a
        subset of the entire PDF specification and meant for storing
        documents long term.
    *   ``pdfa-1``, ``pdfa-2``, ``pdfa-3`` to specify the exact version of
        PDF/A you wish to use.

    If not specified, ``pdfa`` is used. Remember that paperless also keeps
    the original input file as well as the archived version.


PAPERLESS_OCR_PAGES=<num>
    Tells paperless to use only the specified amount of pages for OCR. Documents
    with less than the specified amount of pages get OCR'ed completely.

    Specifying 1 here will only use the first page.

    When combined with ``PAPERLESS_OCR_MODE=redo`` or ``PAPERLESS_OCR_MODE=force``,
    paperless will not modify any text it finds on excluded pages and copy it
    verbatim.

    Defaults to 0, which disables this feature and always uses all pages.

PAPERLESS_OCR_IMAGE_DPI=<num>
    Paperless will OCR any images you put into the system and convert them
    into PDF documents. This is useful if your scanner produces images.
    In order to do so, paperless needs to know the DPI of the image.
    Most images from scanners will have this information embedded and
    paperless will detect and use that information. In case this fails, it
    uses this value as a fallback.

    Set this to the DPI your scanner produces images at.

    Default is none, which will automatically calculate image DPI so that
    the produced PDF documents are A4 sized.


PAPERLESS_OCR_USER_ARGS=<json>
    OCRmyPDF offers many more options. Use this parameter to specify any
    additional arguments you wish to pass to OCRmyPDF. Since Paperless uses
    the API of OCRmyPDF, you have to specify these in a format that can be
    passed to the API. See `the API reference of OCRmyPDF <https://ocrmypdf.readthedocs.io/en/latest/api.html#reference>`_
    for valid parameters. All command line options are supported, but they
    use underscores instead of dashes.

    .. caution::

        Paperless has been tested to work with the OCR options provided
        above. There are many options that are incompatible with each other,
        so specifying invalid options may prevent paperless from consuming
        any documents.

    Specify arguments as a JSON dictionary. Keep note of lower case booleans
    and double quoted parameter names and strings. Examples:

    .. code:: json

        {"deskew": true, "optimize": 3, "unpaper_args": "--pre-rotate 90"}

.. _configuration-tika:

Tika settings
#############

Paperless can make use of `Tika <https://tika.apache.org/>`_ and
`Gotenberg <https://gotenberg.dev/>`_ for parsing and
converting "Office" documents (such as ".doc", ".xlsx" and ".odt"). If you
wish to use this, you must provide a Tika server and a Gotenberg server,
configure their endpoints, and enable the feature.

PAPERLESS_TIKA_ENABLED=<bool>
    Enable (or disable) the Tika parser.

    Defaults to false.

PAPERLESS_TIKA_ENDPOINT=<url>
    Set the endpoint URL were Paperless can reach your Tika server.

    Defaults to "http://localhost:9998".

PAPERLESS_TIKA_GOTENBERG_ENDPOINT=<url>
    Set the endpoint URL were Paperless can reach your Gotenberg server.

    Defaults to "http://localhost:3000".

If you run paperless on docker, you can add those services to the docker-compose
file (see the provided ``docker-compose.tika.yml`` file for reference). The changes
requires are as follows:

.. code:: yaml

    services:
        # ...

        webserver:
            # ...

            environment:
                # ...

                PAPERLESS_TIKA_ENABLED: 1
                PAPERLESS_TIKA_GOTENBERG_ENDPOINT: http://gotenberg:3000
                PAPERLESS_TIKA_ENDPOINT: http://tika:9998

        # ...

        gotenberg:
            image: gotenberg/gotenberg:7
            restart: unless-stopped
            environment:
                CHROMIUM_DISABLE_ROUTES: 1

        tika:
            image: apache/tika
            restart: unless-stopped

Add the configuration variables to the environment of the webserver (alternatively
put the configuration in the ``docker-compose.env`` file) and add the additional
services below the webserver service. Watch out for indentation.

Software tweaks
###############

PAPERLESS_TASK_WORKERS=<num>
    Paperless does multiple things in the background: Maintain the search index,
    maintain the automatic matching algorithm, check emails, consume documents,
    etc. This variable specifies how many things it will do in parallel.


PAPERLESS_THREADS_PER_WORKER=<num>
    Furthermore, paperless uses multiple threads when consuming documents to
    speed up OCR. This variable specifies how many pages paperless will process
    in parallel on a single document.

    .. caution::

        Ensure that the product

            PAPERLESS_TASK_WORKERS * PAPERLESS_THREADS_PER_WORKER

        does not exceed your CPU core count or else paperless will be extremely slow.
        If you want paperless to process many documents in parallel, choose a high
        worker count. If you want paperless to process very large documents faster,
        use a higher thread per worker count.

    The default is a balance between the two, according to your CPU core count,
    with a slight favor towards threads per worker:

    +----------------+---------+---------+
    | CPU core count | Workers | Threads |
    +----------------+---------+---------+
    |              1 |       1 |       1 |
    +----------------+---------+---------+
    |              2 |       2 |       1 |
    +----------------+---------+---------+
    |              4 |       2 |       2 |
    +----------------+---------+---------+
    |              6 |       2 |       3 |
    +----------------+---------+---------+
    |              8 |       2 |       4 |
    +----------------+---------+---------+
    |             12 |       3 |       4 |
    +----------------+---------+---------+
    |             16 |       4 |       4 |
    +----------------+---------+---------+

    If you only specify PAPERLESS_TASK_WORKERS, paperless will adjust
    PAPERLESS_THREADS_PER_WORKER automatically.


PAPERLESS_TIMEOUT_WORKERS=<num>
    Machines with few cores or weak ones might not be able to finish OCR on
    large documents within the default 1800 seconds. So extending this timeout
    may prove be useful.


PAPERLESS_TIME_ZONE=<timezone>
    Set the time zone here.
    See https://docs.djangoproject.com/en/3.1/ref/settings/#std:setting-TIME_ZONE
    for details on how to set it.

    Defaults to UTC.


.. _configuration-polling:

PAPERLESS_CONSUMER_POLLING=<num>
    If paperless won't find documents added to your consume folder, it might
    not be able to automatically detect filesystem changes. In that case,
    specify a polling interval in seconds here, which will then cause paperless
    to periodically check your consumption directory for changes. This will also
    disable listening for file system changes with ``inotify``.

    Defaults to 0, which disables polling and uses filesystem notifications.


PAPERLESS_CONSUMER_DELETE_DUPLICATES=<bool>
    When the consumer detects a duplicate document, it will not touch the
    original document. This default behavior can be changed here.

    Defaults to false.


PAPERLESS_CONSUMER_RECURSIVE=<bool>
    Enable recursive watching of the consumption directory. Paperless will
    then pickup files from files in subdirectories within your consumption
    directory as well.

    Defaults to false.


PAPERLESS_CONSUMER_SUBDIRS_AS_TAGS=<bool>
    Set the names of subdirectories as tags for consumed files.
    E.g. <CONSUMPTION_DIR>/foo/bar/file.pdf will add the tags "foo" and "bar" to
    the consumed file. Paperless will create any tags that don't exist yet.

    This is useful for sorting documents with certain tags such as ``car`` or
    ``todo`` prior to consumption. These folders won't be deleted.

    PAPERLESS_CONSUMER_RECURSIVE must be enabled for this to work.

    Defaults to false.


PAPERLESS_CONVERT_MEMORY_LIMIT=<num>
    On smaller systems, or even in the case of Very Large Documents, the consumer
    may explode, complaining about how it's "unable to extend pixel cache".  In
    such cases, try setting this to a reasonably low value, like 32.  The
    default is to use whatever is necessary to do everything without writing to
    disk, and units are in megabytes.

    For more information on how to use this value, you should search
    the web for "MAGICK_MEMORY_LIMIT".

    Defaults to 0, which disables the limit.

PAPERLESS_CONVERT_TMPDIR=<path>
    Similar to the memory limit, if you've got a small system and your OS mounts
    /tmp as tmpfs, you should set this to a path that's on a physical disk, like
    /home/your_user/tmp or something.  ImageMagick will use this as scratch space
    when crunching through very large documents.

    For more information on how to use this value, you should search
    the web for "MAGICK_TMPDIR".

    Default is none, which disables the temporary directory.

PAPERLESS_OPTIMIZE_THUMBNAILS=<bool>
    Use optipng to optimize thumbnails. This usually reduces the size of
    thumbnails by about 20%, but uses considerable compute time during
    consumption.

    Defaults to true.

PAPERLESS_POST_CONSUME_SCRIPT=<filename>
    After a document is consumed, Paperless can trigger an arbitrary script if
    you like.  This script will be passed a number of arguments for you to work
    with. For more information, take a look at :ref:`advanced-post_consume_script`.

    The default is blank, which means nothing will be executed.

PAPERLESS_FILENAME_DATE_ORDER=<format>
    Paperless will check the document text for document date information.
    Use this setting to enable checking the document filename for date
    information. The date order can be set to any option as specified in
    https://dateparser.readthedocs.io/en/latest/settings.html#date-order.
    The filename will be checked first, and if nothing is found, the document
    text will be checked as normal.

    Defaults to none, which disables this feature.

PAPERLESS_THUMBNAIL_FONT_NAME=<filename>
    Paperless creates thumbnails for plain text files by rendering the content
    of the file on an image and uses a predefined font for that. This
    font can be changed here.

    Note that this won't have any effect on already generated thumbnails.

    Defaults to ``/usr/share/fonts/liberation/LiberationSerif-Regular.ttf``.

PAPERLESS_IGNORE_DATES=<string>
    Paperless parses a documents creation date from filename and file content.
    You may specify a comma separated list of dates that should be ignored during
    this process. This is useful for special dates (like date of birth) that appear
    in documents regularly but are very unlikely to be the documents creation date.

    You may specify dates in a multitude of formats supported by dateparser (see
    https://dateparser.readthedocs.io/en/latest/#popular-formats) but as the dates
    need to be comma separated, the options are limited.
    Example: "2020-12-02,22.04.1999"

    Defaults to an empty string to not ignore any dates.

PAPERLESS_DATE_ORDER=<format>
    Paperless will try to determine the document creation date from its contents.
    Specify the date format Paperless should expect to see within your documents.

    This option defaults to DMY which translates to day first, month second, and year
    last order. Characters D, M, or Y can be shuffled to meet the required order.

PAPERLESS_CONSUMER_IGNORE_PATTERNS=<json>
    By default, paperless ignores certain files and folders in the consumption
    directory, such as system files created by the Mac OS.

    This can be adjusted by configuring a custom json array with patterns to exclude.

    Defautls to ``[".DS_STORE/*", "._*", ".stfolder/*"]``.

Binaries
########

There are a few external software packages that Paperless expects to find on
your system when it starts up.  Unless you've done something creative with
their installation, you probably won't need to edit any of these.  However,
if you've installed these programs somewhere where simply typing the name of
the program doesn't automatically execute it (ie. the program isn't in your
$PATH), then you'll need to specify the literal path for that program.

PAPERLESS_CONVERT_BINARY=<path>
    Defaults to "/usr/bin/convert".

PAPERLESS_GS_BINARY=<path>
    Defaults to "/usr/bin/gs".

PAPERLESS_OPTIPNG_BINARY=<path>
    Defaults to "/usr/bin/optipng".


.. _configuration-docker:

Docker-specific options
#######################

These options don't have any effect in ``paperless.conf``. These options adjust
the behavior of the docker container. Configure these in `docker-compose.env`.

PAPERLESS_WEBSERVER_WORKERS=<num>
    The number of worker processes the webserver should spawn. More worker processes
    usually result in the front end to load data much quicker. However, each worker process
    also loads the entire application into memory separately, so increasing this value
    will increase RAM usage.

    Consider configuring this to 1 on low power devices with limited amount of RAM.

    Defaults to 2.

USERMAP_UID=<uid>
    The ID of the paperless user in the container. Set this to your actual user ID on the
    host system, which you can get by executing

    .. code:: shell-session

        $ id -u

    Paperless will change ownership on its folders to this user, so you need to get this right
    in order to be able to write to the consumption directory.

    Defaults to 1000.

USERMAP_GID=<gid>
    The ID of the paperless Group in the container. Set this to your actual group ID on the
    host system, which you can get by executing

    .. code:: shell-session

        $ id -g

    Paperless will change ownership on its folders to this group, so you need to get this right
    in order to be able to write to the consumption directory.

    Defaults to 1000.

PAPERLESS_OCR_LANGUAGES=<list>
    Additional OCR languages to install. By default, paperless comes with
    English, German, Italian, Spanish and French. If your language is not in this list, install
    additional languages with this configuration option:

    .. code:: bash

        PAPERLESS_OCR_LANGUAGES=tur ces

    To actually use these languages, also set the default OCR language of paperless:

    .. code:: bash

        PAPERLESS_OCR_LANGUAGE=tur

    Defaults to none, which does not install any additional languages.
