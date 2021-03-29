class common_attr:
    """ Contains common custom attributes for ANET objects
    """
    @property
    def full_text(self):
        """ Prevent full_text from being accessed
        """
        raise AttributeError('full_text is not a readable/writable attribute.')