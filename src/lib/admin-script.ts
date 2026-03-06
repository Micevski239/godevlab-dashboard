import type { EventContent, PromotionContent } from "@/types";

export const ADMIN_ADD_URL =
  "https://admin.gogevgelija.com/admin/core/event/add/";

export function generateFillScript(
  event: EventContent,
  listingIds?: number[],
  categoryId?: number | null
): string {
  const fields: Record<string, string> = {
    id_title: event.title,
    id_description: event.description,
    id_date_time: event.date_time,
    id_location: event.location,
    id_entry_price: event.entry_price,
    id_age_limit: event.age_limit,
    id_expectations: JSON.stringify(event.expectations),
    id_title_mk: event.title_mk,
    id_description_mk: event.description_mk,
    id_location_mk: event.location_mk,
    id_entry_price_mk: event.entry_price_mk,
    id_age_limit_mk: event.age_limit_mk,
    id_expectations_mk: JSON.stringify(event.expectations_mk),
    // Contact Information
    id_phone_number: event.phone_number || "",
    id_website_url: event.website_url || "",
    id_facebook_url: event.facebook_url || "",
    id_instagram_url: event.instagram_url || "",
    id_google_maps_url: event.google_maps_url || "",
  };

  const json = JSON.stringify(fields);
  const idsJson = JSON.stringify(listingIds || []);
  const catId = categoryId ?? "";

  return `(function(){
var d=${json};var f=0;
for(var id in d){if(!d[id])continue;var el=document.getElementById(id);if(!el)continue;el.value=d[id];el.dispatchEvent(new Event('change',{bubbles:true}));f++;}
var catId='${catId}';
if(catId){var cat=document.getElementById('id_category');if(cat){cat.value=catId;cat.dispatchEvent(new Event('change',{bubbles:true}));f++;}}
var ids=${idsJson};
if(ids.length&&typeof SelectBox!=='undefined'){
  var from=document.getElementById('id_listings_from');
  if(from){
    for(var i=0;i<from.options.length;i++){
      if(ids.indexOf(Number(from.options[i].value))!==-1){
        from.options[i].selected=true;
      }
    }
    SelectBox.move('id_listings_from','id_listings_to');
    f+=ids.length;
  }
}
console.log('Filled '+f+' fields');
})();`;
}

export const ADMIN_ADD_PROMOTION_URL =
  "https://admin.gogevgelija.com/admin/core/promotion/add/";

export function generatePromotionFillScript(
  promo: PromotionContent
): string {
  const fields: Record<string, string> = {
    id_title: promo.title,
    id_description: promo.description,
    id_tags: JSON.stringify(promo.tags),
    id_title_mk: promo.title_mk,
    id_description_mk: promo.description_mk,
    id_tags_mk: JSON.stringify(promo.tags_mk),
    id_valid_until: promo.valid_until || "",
    id_discount_code: promo.discount_code || "",
    id_phone_number: promo.phone_number || "",
    id_website: promo.website || "",
    id_facebook_url: promo.facebook_url || "",
    id_instagram_url: promo.instagram_url || "",
    id_address: promo.address || "",
    id_google_maps_url: promo.google_maps_url || "",
  };

  const json = JSON.stringify(fields);

  return `(function(){
var d=${json};var f=0;
for(var id in d){if(!d[id])continue;var el=document.getElementById(id);if(!el)continue;el.value=d[id];el.dispatchEvent(new Event('change',{bubbles:true}));f++;}
var cb=document.getElementById('id_has_discount_code');if(cb&&${promo.has_discount_code}){cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));f++;}
console.log('Filled '+f+' fields');
})();`;
}
