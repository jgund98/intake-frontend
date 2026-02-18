/**
 * GraphQL Query for Organization Partner Integration Public Info
 *
 * This query fetches comprehensive organization data including:
 * - Organization settings and configuration
 * - Color and styling customizations
 * - Form structure and questions
 * - FAQ data
 * - Product bundles and pricing
 * - Promo codes
 */

export const ORG_DATA_QUERY = `
  query OrganizationPartnerIntegrationPublicInfo($linkName: String) {
    organizationPartnerIntegrationPublicInfo(linkName: $linkName) {
      id
      organizationId
      linkName
      monthlyCost
      tagline
      allowSelfSignup
      enableSelfSignupPayment
      referralCodeEnabled
      showCarouselPrices
      showTestimonials
      organizationDomainName
      organizationDomainLink
      homeLink
      enableLegitScriptLogo
      legitScriptIntegrationId
      membersAreaLink
      orderStatusLink
      instructionsLink
      supportLink
      videoLink
      affiliateLink
      contactEmail
      contactPhone
      termsOfServicesLink
      privacyPolicyLink
      fulfillmentPolicyLink
      jotformLink
      organizationName
      medicalConsentLink
      forCaliforniaResidentsLink
      billOfRightsLink

      colorPrimary
      colorFaqGradientBottom

      primaryMedicationTitleText
      primaryMedicationLargeTitleTextColor
      primaryMedicationTitleTextColor
      primaryMedicationSubtitle1Text
      primaryMedicationSubtitle1TextColor
      primaryMedicationSubtitle2Text
      primaryMedicationSubtitle2TextColor

      seeIfIQualifyButtonText
      seeIfIQualifyButtonTextColor
      seeIfIQualifyButtonColor

      journeyHeadingTextColor
      journeyItem1TitleText
      journeyItem1TitleTextColor
      journeyItem1SubtitleText
      journeyItem1SubtitleTextColor
      journeyItem2TitleText
      journeyItem2TitleTextColor
      journeyItem2SubtitleText
      journeyItem2SubtitleTextColor
      journeyItem3TitleText
      journeyItem3TitleTextColor
      journeyItem3SubtitleText
      journeyItem3SubtitleTextColor

      secondaryMedicationTitleText
      secondaryMedicationTitleTextColor
      secondaryMedicationBodyText
      secondaryMedicationMainBodyTextColor
      secondaryMedicationBodyTextColor

      productPaymentLabelText
      productPaymentLabelTextColor

      signupSuccessMessageText
      signupSuccessMessageTextColor
      paymentSuccessMessageText
      paymentSuccessMessageTextColor
      attachPaymentInfoSuccessText

      logosHeadingTextColor
      logosColor

      faqTitleTextColor
      faqBodyTextColor
      complianceLogosTitleTextColor
      headerLinksTextColor
      footerLinksTextColor
      copyrightTextColor
      legalLinksTextColor
      carouselProductTextColor
      productCategoriesColor

      addHomeLinkToHeader
      homeLinkName
      showLogos
      selfSignUpProfileFields
      selfSignUpSmsNotificationsRequired
      hideSeeIfQualifyBtn
      journeyTitleText
      useModalForSignup
      formHeaderColor
      formHeaderText
      showProductCategoriesInLandingPage
      showGDPRLogo
      autoCreateUserPromoCodes
      masterUserPromoCodeId
      paymentProvider
      nmiCollectJsPublicKey

      form {
        id
        name
        description
        isActive
        versionId
        versionNumber
        showStepsIndividually
        organization {
          id
        }
        questions {
          id
          text
          type
          required
          placeholder
          hint
          isPHI
          options
          renderMode
          index
          condition {
            questionIndex
            response
          }
          document {
            id
            fileName
            isGlobal
          }
        }
      }

      faq {
        id
        question
        answer
        index
      }

      productBundles {
        id
        name
        description
        price
        priceUnit
        initialDiscount
        imageUrl
        linkName
        tag
        isSoldOut
        soldOutListText
        soldOutListColor
        soldOutModalText
        soldOutModalColor
        products {
          name
          imageUrl
          categories {
            id
          }
        }
        formVersion {
          forms {
            id
            versionId
            name
            isActive
            showStepsIndividually
            questions {
              id
              text
            }
          }
        }
      }

      defaultProductBundle {
        id
        name
        description
        price
        priceUnit
        initialDiscount
        imageUrl
        linkName
        tag
        isSoldOut
        soldOutListText
        soldOutListColor
        soldOutModalText
        soldOutModalColor
        products {
          name
          imageUrl
          categories {
            id
          }
        }
        formVersion {
          forms {
            id
            versionId
            name
            isActive
            showStepsIndividually
            questions {
              id
              text
            }
          }
        }
      }

      visiblePromoCodes {
        name
        label
        description
      }

      analyticsPromoCodes {
        name
        label
        description
      }
    }
  }
`;
