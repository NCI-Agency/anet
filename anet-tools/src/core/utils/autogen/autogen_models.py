from src.core.utils.helper.method import helper_methods

helper_methods.update_anet_models(["locations",
                                    "organizations",
                                    "people",
                                    "positions",
                                    "reports"], 
                                    helper_methods.generate_conn_str(use_env=True))